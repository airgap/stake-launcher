import { useEffect, useId, useState } from "react";
import { useBalance } from "./balanceStore";
import { setSettings, useSettings } from "./reactSettingsStore";
import "react-responsive-modal/styles.css";
import { Modal, ModalProps } from "react-responsive-modal";
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
  const modalStyles: ModalProps['styles'] = {
    modal: {
      backgroundColor: "#000000AA",
      backdropFilter: "blur(10px)",
      borderRadius: "5px",
    },
  };
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
        <h2>Balance: {balance ? `$${balance.toFixed(2)}` : <button className="link">Check</button>}</h2>
      </center>
      <table>
        <tbody>
          {settings?.apiKey && <tr>
            <td>
              <input
                type="checkbox"
                onChange={(e) => setSms(e.target.checked)}
              />
            </td>
            <td>Enable SMS</td>
          </tr>}
          <tr>
            <td></td>
            <td>SMS threshold</td>
            <td>
              <div  className="currencyInput"><input type="number" min={0} value={notifyThreshold} /></div>
            </td>
          </tr>
        </tbody>
      </table>
      <button className="link" onClick={() => setFarmCredModal(true)}>
        Preload login
      </button>
      <button className="link" onClick={() => setApiKeyModal(true)}>Set API key</button>
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
        <p>Careful with this! Please don't put your main wallet here. This is just for development.</p>
        <button className="link"
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
        <button className="link"
          onClick={() => {
            setFarmEmail(farmEmail||undefined);
            setFarmPassword(farmPassword||undefined);
            setFarmCredModal(false);
          }}
        >
          Cancel
        </button>
      </Modal>
      <Modal open={apiKeyModal} onClose={() => setApiKeyModal(false)} styles={modalStyles}>
        <h3>API key</h3>
        <input
          type="password"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
        />
        <br/><br/>
        <button className="link"
          onClick={() => {
            const newSettings = {
              ...settings,
              apiKey: apiKey || undefined,
            };
            setSettings(newSettings||undefined);
            (window as any).electronAPI.settingsChanged(newSettings);
            setApiKeyModal(false);
          }}
        >
          Save
        </button>
        <button className="link"
          onClick={() => {
            setFarmEmail(farmEmail||undefined);
            setFarmPassword(farmPassword||undefined);
          }}
        >
          Cancel
        </button>
      </Modal>
      <footer>Development usage only</footer>
    </div>
  );
};
