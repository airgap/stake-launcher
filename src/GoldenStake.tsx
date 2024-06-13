import { useEffect, useId, useState } from "react";
import { useBalance } from "./balanceStore";
import { setSettings, settings, useSettings } from "./reactSettingsStore";
import { settingsModel, Setting, Settings } from "./settingsModel";
import "react-responsive-modal/styles.css";
import { Modal } from "react-responsive-modal";
export const sendSms = (balance: number) => false;
export const GoldenStake = () => {
  const settings = useSettings();
  const balance = useBalance();
  const [lastAlert, setLastAlert] = useState(0);
  const [sms, setSms] = useState<boolean>(false);
  const [notifyThreshold, setNotifyThreshold] = useState(
    settings?.notifyThreshold,
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
  const [farmCredModal, setFarmCredModal] = useState(false);
  const [apiKeyModal, setApiKeyModal] = useState(false);
  useEffect(() => {
    if (!(sms && notifyThreshold)) return;
    if (balance > notifyThreshold && balance > lastAlert) {
      setLastAlert(balance);
      sendSms(balance);
    }
  }, [sms, balance, lastAlert, notifyThreshold]);
  return (
    <div>
      <center>
        <h2>Balance{balance ? `: $${balance.toFixed(2)}` : "unchecked"}</h2>
      </center>
      {settings?.apiKey && (
        <>
          <input
            type={"checkbox"}
            checked={settings.sms}
            onChange={(e) => setSms(e.target.checked)}
          />
        </>
      )}
      <table>
        <tbody>
          <tr>
            <td>
              <input
                type="checkbox"
                onChange={(e) => setSms(e.target.checked)}
              />
            </td>
            <td>Enable SMS</td>
          </tr>
          <tr>
            <td></td>
            <td>SMS threshold</td>
            <td>
              $<input type="number" min={0} value={notifyThreshold} />
            </td>
          </tr>
        </tbody>
      </table>
      <button onClick={() => setFarmCredModal(true)}>
        Preload StakingFarm login
      </button>
      <button onClick={() => setApiKeyModal(true)}>Set API key</button>
      <Modal
        open={farmCredModal}
        onClose={() => setFarmCredModal(false)}
        styles={{
          modal: {
            backgroundColor: "#000000AA",
            backdropFilter: "blur(10px)",
            borderRadius: "5px",
          },
        }}
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
        <button
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
          onClick={() => {
            setFarmEmail(settings.farmEmail);
            setFarmPassword(settings.farmPassword);
            setFarmCredModal(false);
          }}
        >
          Cancel
        </button>
      </Modal>
      <Modal open={apiKeyModal} onClose={() => setApiKeyModal(false)}>
        <h3>API key</h3>
        <input
          type="password"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
        />
        <button
          onClick={() => {
            const newSettings = {
              ...settings,
              apiKey: apiKey || undefined,
            };
            setSettings(newSettings);
            (window as any).electronAPI.settingsChanged(newSettings);
            setApiKeyModal(false);
          }}
        >
          Save
        </button>
        <button
          onClick={() => {
            setFarmEmail(settings.farmEmail);
            setFarmPassword(settings.farmPassword);
          }}
        >
          Cancel
        </button>
      </Modal>
      <footer>f</footer>
    </div>
  );
};
