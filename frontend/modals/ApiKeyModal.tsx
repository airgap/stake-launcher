import { ModalProps } from "react-responsive-modal";
import { StakeModal } from "./StakeModal";
import { setSettings, settings } from "../reactSettingsStore";
import { useState } from "react";
import { Settings } from "../../models/settings";
export const ApiKeyModal = (props: ModalProps) => {
  const [apiKey, setApiKey] = useState(settings?.apiKey ?? "");
  return (
    <StakeModal {...props}>
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
        onClick={async () => {
          const newSettings = {
            ...settings,
            apiKey: apiKey || undefined,
          } satisfies Settings;
          setSettings(newSettings || undefined);
          await window.electronAPI.settingsChanged(newSettings);
          props.onClose();
        }}
      >
        Save
      </button>
      <button
        className="link"
        onClick={() => {
          setApiKey(settings?.apiKey ?? "");
          props.onClose();
        }}
      >
        Cancel
      </button>
    </StakeModal>
  );
};
