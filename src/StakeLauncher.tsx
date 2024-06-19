import { useEffect, useId, useState } from "react";
import { useBalance } from "./balanceStore";
import { setSettings, useSettings } from "./reactSettingsStore";
import "react-responsive-modal/styles.css";
import { Modal, ModalProps } from "react-responsive-modal";
import { Flashbar, FlashbarProps } from "@cloudscape-design/components";
import MessageDefinition = FlashbarProps.MessageDefinition;
import { Order, Plan } from "./preload";
import { Bubbles } from "./Bubbles";
import { Settings } from "./settingsModel";
const { electronAPI } = window as any;
export const Unchecked = () => <i>unchecked</i>;
export const sendSms = (balance: number) => false;
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
    electronAPI.onError((error: Error) => {
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
  const [lastAlert, setLastAlert] = useState(0);
  // const [sms, setSms] = useState<boolean>(false);
  const [notifyThreshold, setNotifyThreshold] = useState(
    settings?.notifyThreshold?.toFixed(2) ?? "",
  );
  const [apiKey, setApiKey] = useState(settings?.apiKey ?? "");
  const [farmEmail, setFarmEmail] = useState(settings?.farmEmail ?? "");
  const [farmPassword, setFarmPassword] = useState(
    settings?.farmPassword ?? "",
  );
  const [autobuy, setAutobuy] = useState(false);
  const [autobuyThreshold, setAutobuyThreshold] = useState(
    settings?.autobuyThreshold,
  );
  const [plans, setPlans] = useState<Plan[]>();
  const [orders, setOrders] = useState<Order[]>();
  const [totalDaily, setTotalDaily] = useState<number>();
  const [farmCredModal, setFarmCredModal] = useState(false);
  const [apiKeyModal, setApiKeyModal] = useState(false);
  const [querying, setQuerying] = useState(false);
  const modalStyles: ModalProps["styles"] = {
    modal: {
      backgroundColor: "#000000AA",
      backdropFilter: "blur(10px)",
      borderRadius: "5px",
    },
  };
  const checkBalance = async () => {
    setQuerying(true);
    await electronAPI.getBalance();
    setQuerying(false);
  };
  const Check = ({ onClick }: { onClick: () => void }) => (
    <button className="link" disabled={querying} onClick={onClick}>
      Check
    </button>
  );

  useEffect(() => {
    if (!(settings?.sms && settings.notifyThreshold && balance)) return;
    if (balance > settings.notifyThreshold && balance > lastAlert) {
      setLastAlert(balance);
      sendSms(balance);
    }
  }, [settings?.sms, balance, lastAlert, settings?.notifyThreshold]);

  useEffect(() => {
    electronAPI.onPlansUpdate(setPlans);
    electronAPI.onOrdersUpdate(setOrders);
  }, []);
  useEffect(() => {
    console.log("orders", orders, "plans", plans);
    if (!(orders?.length && plans?.length)) return;
    const now = +new Date();
    setTotalDaily(
      orders
        .filter((order) => order.nextPayment > now)
        .map(
          (order) => plans.find((plan) => plan.name === order.contract)?.daily,
        )
        .reduce((a, b) => (a ?? 0) + (b ?? 0)),
    );
  }, [orders, plans]);

  useEffect(() => {
    setApiKey(settings?.apiKey ?? "");
  }, [settings?.apiKey]);
  console.log("api key", settings?.apiKey, "loaded", apiKey);

  // useEffect(() => {
  //     setApiKey(settings.apiKey)
  //     setNotifyThreshold(settings.notifyThreshold?.toFixed(2))
  //     setAutobuyThreshold(settings.autobuyThreshold)
  // },[settings])

  // useEffect(() => {
  //   electronAPI.getPlans();
  // }, []);
  return (
    <div>
      <Flashbar items={notifications} />
      <center>
        <h2>
          Balance: {balance ? `$${balance.toFixed(2)}` : <Unchecked />}
          <Check onClick={checkBalance} />
        </h2>
        <h2>
          Total daily:{" "}
          {totalDaily ? `$${totalDaily.toFixed(2)}` : <Unchecked />}
          <Check
            onClick={async () => {
              setQuerying(true);
              await electronAPI.getPlans();
              await electronAPI.getOrders();
              setQuerying(false);
            }}
          />
        </h2>
      </center>
      <table>
        <tbody>
          {settings?.apiKey && (
            <>
              <tr>
                <td>
                  <input
                    type="checkbox"
                    onChange={(e) => {
                      const set = {
                        ...settings,
                        sms: e.currentTarget.checked,
                      } as Settings;
                      setSettings(set);
                      electronAPI.settingsChanged(set);
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
                          electronAPI.settingsChanged(set);
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
      <button className="link" onClick={() => setFarmCredModal(true)}>
        Preload login
      </button>
      <button className="link" onClick={() => setApiKeyModal(true)}>
        Set API key
      </button>
      <Bubbles daily={totalDaily} />
      <Modal
        open={farmCredModal}
        onClose={() => setFarmCredModal(false)}
        styles={modalStyles}
      >
        <h3>Farm email</h3>
        <input
          type="email"
          value={farmEmail}
          onChange={(e) => setFarmEmail(e.target.value)}
        />
        <h3>Farm password</h3>
        <input
          type="password"
          value={farmPassword}
          onChange={(e) => setFarmPassword(e.target.value)}
        />
        <p>
          Careful with this! Please don't put your main wallet here. This is
          just for development.
        </p>
        <button
          className="link"
          onClick={() => {
            const newSettings = {
              ...settings,
              farmEmail: farmEmail || undefined,
              farmPassword: farmPassword || undefined,
            };
            setSettings(newSettings);
            (window as any).electronAPI.settingsChanged(newSettings);
            setFarmCredModal(false);
          }}
        >
          Save
        </button>
        <button
          className="link"
          onClick={() => {
            setFarmEmail(settings?.farmEmail || "");
            setFarmPassword(settings?.farmPassword || "");
            setFarmCredModal(false);
          }}
        >
          Cancel
        </button>
      </Modal>
      <Modal
        open={apiKeyModal}
        onClose={() => setApiKeyModal(false)}
        styles={modalStyles}
      >
        <h3>API key</h3>
        <input
          type="password"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
        />
        <br />
        <br />
        <button
          className="link"
          onClick={() => {
            const newSettings = {
              ...settings,
              apiKey: apiKey || undefined,
            };
            setSettings(newSettings || undefined);
            electronAPI.settingsChanged(newSettings);
            setApiKeyModal(false);
          }}
        >
          Save
        </button>
        <button
          className="link"
          onClick={() => {
            setFarmEmail(settings?.farmEmail ?? "");
            setFarmPassword(settings?.farmPassword ?? "");
            setApiKeyModal(false);
          }}
        >
          Cancel
        </button>
      </Modal>
      <footer>Development usage only</footer>
    </div>
  );
};
