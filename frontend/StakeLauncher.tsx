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
import { Order, Plan, Settings } from "../models";
import { Bubbles } from "./Bubbles/Bubbles";
import { ApiKeyModal } from "./modals/ApiKeyModal";
import { FarmCredModal } from "./modals/FarmCredModal";
import { Tooltip } from "./Tooltip/Tooltip";
import { useTime } from "./useTime";
import { timeSince, timeUntil } from "./timeUntil";
import { sendSms } from "./sendSms";
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
import styles from "./StakeLauncher.module.sass";
export const Unchecked = () => <i>&ndash;</i>;
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
  const ntime = +time;
  const [lastAlert, setLastAlert] = useState(0);
  // const [sms, setSms] = useState<boolean>(false);
  const [notifyThreshold, setNotifyThreshold] = useState(
    settings?.notifyThreshold?.toFixed(2) ?? "",
  );
  const [autobuy, setAutobuy] = useState(false);
  const [autobuyThreshold, setAutobuyThreshold] = useState(
    settings?.autobuyThreshold,
  );
  const [plans, setPlans] = useState<Plan[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  // const [totalDaily, setTotalDaily] = useState<number>();
  // const [totalNext24h, setTotalNext24h] = useState<number>();
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
    if (
      !(settings?.sms && settings.apiKey && settings.notifyThreshold && balance)
    )
      return;
    if (balance > settings.notifyThreshold && balance > lastAlert) {
      setLastAlert(balance);
      sendSms(balance);
    }
  }, [
    settings?.sms,
    balance,
    lastAlert,
    settings?.notifyThreshold,
    settings?.apiKey,
  ]);

  useEffect(() => {
    onPlansUpdate(setPlans);
    onOrdersUpdate(setOrders);
    void scanSite();
  }, []);
  const startOfDay = new Date(time).setHours(0, 0, 0, 0);

  // Step 2: Use a simple function to filter orders
  const filterOrdersAfterDate = (orders: Order[], date: number): Order[] =>
    orders.filter(
      ({ nextPayment }: { nextPayment: number }): boolean => nextPayment > date,
    );

  const ordersAfterThisMorning = useMemo<Order[]>(
    () => filterOrdersAfterDate(orders, startOfDay),
    [orders, startOfDay],
  );

  const futureOrders = useMemo((): Order[] => {
    const ntime = +time;
    return filterOrdersAfterDate(ordersAfterThisMorning, ntime);
  }, [ordersAfterThisMorning, time]);
  const orderMap = useMemo(
    (): Record<string, Order> =>
      orders.reduce(
        (acc, o) => {
          acc[o.contract] = o;
          return acc;
        },
        {} as Record<string, Order>,
      ),
    [orders],
  );
  const findPlansAndAdd = (orders: Order[]): number =>
    orders
      .map(
        (order: Order): number =>
          plans.find((plan: Plan) => plan.name === order.contract)?.daily ?? 0,
      )
      .reduce((a, b): number => a + b, 0);
  const totalNext24h = useMemo(
    () => findPlansAndAdd(futureOrders),
    [futureOrders],
  );
  const totalDaily = useMemo(
    () => findPlansAndAdd(ordersAfterThisMorning),
    [ordersAfterThisMorning],
  );
  const [lastExpire, nextExpire] = useMemo(() => {
    let soonest: Order | undefined = undefined;
    let latest: Order | undefined = undefined;
    for (const o of orders) {
      if (o.expires < ntime && (!latest || o.expires > latest.expires))
        latest = o;
      if (o.expires > ntime && (!soonest || o.expires < soonest.expires))
        soonest = o;
    }
    return [latest, soonest];
  }, [orders, ntime]);
  const timeSinceLastExpire =
    lastExpire?.expires && timeSince(lastExpire.expires);
  const timeUntilNextExpire =
    nextExpire?.expires && timeUntil(nextExpire.expires);

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
          Balance
          <Tooltip>Amount currently available to invest or withdraw</Tooltip>
        </td>
        <td>{balance ? `$${balance.toFixed(2)}` : <Unchecked />}</td>
      </tr>
    ),
    [balance],
  );
  const dailyDisplay = useMemo(
    () => (
      <tr>
        <td>
          Today
          <Tooltip>
            Amount earned between 12:00am today and 12:00am tomorrow
          </Tooltip>
        </td>
        <td>{totalDaily ? `$${totalDaily.toFixed(2)}` : <Unchecked />}</td>
      </tr>
    ),
    [totalDaily],
  );
  const lastExpireDisplay = useMemo(
    () => (
      <tr>
        <td>
          Last expire
          <Tooltip>
            {timeSinceLastExpire
              ? `${lastExpire.contract} expired ${timeSinceLastExpire} ago`
              : "How long since your last order expired"}
          </Tooltip>
        </td>
        {lastExpire ? (
          <>
            <td>${lastExpire.amount.toFixed(2)}</td>
            <td />
            <td>{timeSinceLastExpire}</td>
            <td>ago</td>
          </>
        ) : (
          <Unchecked />
        )}
      </tr>
    ),
    [nextExpire, ntime],
  );
  const nextExpireDisplay = useMemo(
    () => (
      <tr>
        <td>
          Next expire
          <Tooltip>
            {timeUntilNextExpire
              ? `${nextExpire.contract} will expire in ${timeUntilNextExpire}`
              : "The time until your next order will expire"}
          </Tooltip>
        </td>
        {nextExpire ? (
          <>
            <td>${nextExpire.amount.toFixed(2)}</td>
            <td>&nbsp;in&nbsp;</td>
            <td>{timeUntilNextExpire}</td>
          </>
        ) : (
          <Unchecked />
        )}
      </tr>
    ),
    [nextExpire, ntime],
  );
  const next24HoursDisplay = useMemo(
    () => (
      <tr>
        <td>
          Next 24h
          <Tooltip>Amount earned between now and this time tomorrow</Tooltip>
        </td>
        <td>{totalNext24h ? `$${totalNext24h.toFixed(2)}` : <Unchecked />}</td>
      </tr>
    ),
    [totalNext24h],
  );
  return (
    <div className={styles.StakeLauncher}>
      <Flashbar items={notifications} />
      <table style={{ fontSize: "1.5rem", lineHeight: "2rem" }}>
        <tbody>
          {balanceDisplay}
          {dailyDisplay}
          {next24HoursDisplay}
          {lastExpireDisplay}
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
                  parseFloat(notifyThreshold.replace(/,/g, "")) !==
                    settings?.notifyThreshold && (
                    <td>
                      <button
                        onClick={() => {
                          const set = {
                            ...settings,
                            notifyThreshold: parseFloat(
                              notifyThreshold.replace(/,/g, ""),
                            ),
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
