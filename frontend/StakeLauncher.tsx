import { useEffect, useMemo, useState } from "react";
import { useBalance } from "./balanceStore";
import { setSettings, useSettings } from "./reactSettingsStore";
import "react-responsive-modal/styles.css";
import {
  Flashbar,
  FlashbarProps,
  Spinner,
} from "@cloudscape-design/components";
import MessageDefinition = FlashbarProps.MessageDefinition;
import { Order, Plan } from "./preload";
import { Bubbles } from "./Bubbles/Bubbles";
import { Settings } from "../models/settingsModel";
import { ApiKeyModal } from "./modals/ApiKeyModal";
import { FarmCredModal } from "./modals/FarmCredModal";
import { Tooltip } from "./Tooltip/Tooltip";
import { useTime } from "./useTime";
import { timeUntil } from "./timeUntil";
import {sendSms} from "./sendSms";
const {
  getBalance,
  onOrdersUpdate,
  getOrders,
  onPlansUpdate,
  getPlans,
  onError,
  settingsChanged,
  purgeCookies,
} = window.electronAPI;
export const Unchecked = () => <i>unchecked</i>;
export const StakeLauncher = () => {
  const [notifications, setNotifications] = useState<MessageDefinition[]>([]);
  const dismissNotification = (label: string) => {
    const index = notifications.findIndex(
      ({ dismissLabel }) => dismissLabel === label,
    );
    setNotifications([
      ...notifications.slice(0, index),
      ...notifications.splice(index),
    ]);
  };
  useEffect(() => {
    onError((error: Error) => {
      const label = Math.random().toString().substring(2);
      setNotifications([
        ...notifications,
        {
          header: error.name,
          type: "error",
          content: error.message,
          dismissible: true,
          dismissLabel: label,
          onDismiss: () => dismissNotification(label),
        },
      ]);
      console.log("Got error", error);
    });
  }, []);
  const settings = useSettings();
  const balance = useBalance();
  const time = useTime();
  const [lastAlert, setLastAlert] = useState(0);
  // const [sms, setSms] = useState<boolean>(false);
  const [notifyThreshold, setNotifyThreshold] = useState(
    settings?.notifyThreshold?.toFixed(2) ?? "",
  );
  const [autobuy, setAutobuy] = useState(false);
  const [autobuyThreshold, setAutobuyThreshold] = useState(
    settings?.autobuyThreshold,
  );
  const [plans, setPlans] = useState<Plan[]>();
  const [orders, setOrders] = useState<Order[]>();
  const [totalDaily, setTotalDaily] = useState<number>();
  const [totalNext24h, setTotalNext24h] = useState<number>();
  const [farmCredModal, setFarmCredModal] = useState(false);
  const [apiKeyModal, setApiKeyModal] = useState(false);
  const [querying, setQuerying] = useState(false);
  const scanSite = async () => {
    setQuerying(true);
    await getBalance();
    await Promise.all([getPlans(), getOrders()]);
    setQuerying(false);
  };
  const check = useMemo(
    () =>
      querying ? (
        <Spinner />
      ) : (
        <button className="link" onClick={scanSite}>
          ↻
        </button>
      ),
    [querying],
  );

  useEffect(() => {
    if (!(settings?.sms && settings.apiKey && settings.notifyThreshold && balance)) return;
    if (balance > settings.notifyThreshold && balance > lastAlert) {
      setLastAlert(balance);
      sendSms(balance);
    }
  }, [settings?.sms, balance, lastAlert, settings?.notifyThreshold, settings?.apiKey]);

  useEffect(() => {
    onPlansUpdate(setPlans);
    onOrdersUpdate(setOrders);
    void scanSite();
  }, []);
  const [nextExpire, setNextExpire] = useState<Order>();
  useEffect(() => {
    console.log("orders", orders);
    if (!(orders?.length && plans?.length)) return;
    const findPlansAndAdd = (orders: Order[]) =>
      orders
        .map(
          (order) => plans.find((plan) => plan.name === order.contract)?.daily,
        )
        .reduce((a, b) => (a ?? 0) + (b ?? 0));
    const ordersAfterThisMorning = orders.filter(
      (order) => order.nextPayment > new Date(time).setHours(0, 0, 0, 0),
    );
    const futureOrders = ordersAfterThisMorning.filter(
      (order) => order.nextPayment > +time,
    );
    setTotalNext24h(findPlansAndAdd(futureOrders));
    setTotalDaily(findPlansAndAdd(ordersAfterThisMorning));
    setNextExpire(
      orders
        .filter((o) => o.expires > +time)
        .reduce((l, r) => (l.expires < r.expires ? l : r)),
    );
  }, [orders, plans, time]);

  const timeUntilNextExpire =
    nextExpire?.expires && timeUntil(nextExpire?.expires);

  // useEffect(() => {
  //     setApiKey(settings.apiKey)
  //     setNotifyThreshold(settings.notifyThreshold?.toFixed(2))
  //     setAutobuyThreshold(settings.autobuyThreshold)
  // },[settings])

  // useEffect(() => {
  //   getPlans();
  // }, []);
  const balanceDisplay = useMemo(
    () => (
      <tr>
        <td>
          <h3>
            Balance
            <Tooltip>Amount currently available to invest or withdraw</Tooltip>
          </h3>
        </td>
        <td>
          <h3>{balance ? `$${balance.toFixed(2)}` : <Unchecked />}</h3>
        </td>
      </tr>
    ),
    [balance],
  );
  const dailyDisplay = useMemo(
    () => (
      <tr>
        <td>
          <h3>
            Today
            <Tooltip>
              Amount earned between 12:00am today and 12:00am tomorrow
            </Tooltip>
          </h3>
        </td>
        <td>
          <h3>{totalDaily ? `$${totalDaily.toFixed(2)}` : <Unchecked />}</h3>
        </td>
      </tr>
    ),
    [totalDaily],
  );
  const nextExpireDisplay = useMemo(
    () => (
      <tr>
        <td>
          <h3>
            Next expire
            <Tooltip>
              {timeUntilNextExpire
                ? `Your next order will expire in ${timeUntilNextExpire}`
                : "The time until your next order will expire"}
            </Tooltip>
          </h3>
        </td>
        <td>
          <h3>
            {nextExpire ? (
              `$${nextExpire.amount.toFixed(2)} in ${timeUntilNextExpire}`
            ) : (
              <Unchecked />
            )}
          </h3>
        </td>
      </tr>
    ),
    [nextExpire],
  );
  const next24HoursDisplay = useMemo(
    () => (
      <tr>
        <td>
          <h3>
            Next 24h
            <Tooltip>Amount earned between now and this time tomorrow</Tooltip>
          </h3>
        </td>
        <td>
          <h3>
            {totalNext24h ? `$${totalNext24h.toFixed(2)}` : <Unchecked />}
          </h3>
        </td>
      </tr>
    ),
    [totalNext24h],
  );
  return (
    <div>
      <Flashbar items={notifications} />
      <table>
        <tbody>
          {balanceDisplay}
          {dailyDisplay}
          {next24HoursDisplay}
          {nextExpireDisplay}
          {settings?.apiKey && (
            <>
              <tr>
                <td>
                  <input
                    type="checkbox"
                    onChange={async (e) => {
                      const set = {
                        ...settings,
                        sms: e.currentTarget.checked,
                      } as Settings;
                      setSettings(set);
                      await settingsChanged(set);
                    }}
                  />
                </td>
                <td>Enable SMS</td>
              </tr>
              <tr>
                <td></td>
                <td>SMS threshold</td>
                <td>
                  <div className="currencyInput">
                    <input
                      type="number"
                      min={0}
                      value={notifyThreshold}
                      onInput={(e) => setNotifyThreshold(e.currentTarget.value)}
                    />
                  </div>
                </td>
                {notifyThreshold &&
                  parseFloat(notifyThreshold) !== settings?.notifyThreshold && (
                    <td>
                      <button
                        onClick={() => {
                          const set = {
                            ...settings,
                            notifyThreshold: parseFloat(notifyThreshold),
                          } as Settings;
                          setSettings(set);
                          settingsChanged(set);
                        }}
                      >
                        ✔️
                      </button>
                      <button
                        onClick={() =>
                          setNotifyThreshold(
                            settings?.notifyThreshold?.toFixed(2) ?? "",
                          )
                        }
                      >
                        ❌
                      </button>
                    </td>
                  )}
              </tr>
            </>
          )}
        </tbody>
      </table>
      {/*<button className="link" onClick={() => setFarmCredModal(true)}>*/}
      {/*    Preload login*/}
      {/*</button>*/}
      <button className="link" onClick={() => setApiKeyModal(true)}>
        Set API key
      </button>
      <button
        className="link"
        onClick={async () => {
          setQuerying(true);
          await purgeCookies();
          setQuerying(false);
        }}
      >
        Purge session
      </button>
      {check}
      <Bubbles daily={totalDaily} />
      <FarmCredModal
        open={farmCredModal}
        onClose={() => setFarmCredModal(false)}
      />
      <ApiKeyModal open={apiKeyModal} onClose={() => setApiKeyModal(false)} />
      <footer>Development usage only</footer>
    </div>
  );
};
