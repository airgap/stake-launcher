import { Modal, ModalProps } from "react-responsive-modal";
import { setSettings, settings } from "./reactSettingsStore";
import { StakeModal } from "./StakeModal";
import { useState } from "react";
import { Settings } from "./settingsModel";

export const FarmCredModal = (props: ModalProps) => {
  const [farmEmail, setFarmEmail] = useState(settings?.farmEmail ?? "");
  const [farmPassword, setFarmPassword] = useState(
    settings?.farmPassword ?? "",
  );
  return (
    <StakeModal {...props}>
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
        Careful with this! Please don't put your main wallet here. This is just
        for development.
      </p>
      <button
        className="link"
        onClick={() => {
          const newSettings = {
            ...settings,
            farmEmail: farmEmail || undefined,
            farmPassword: farmPassword || undefined,
          } satisfies Settings;
          setSettings(newSettings);
          (window as any).electronAPI.settingsChanged(newSettings);
          props.onClose();
        }}
      >
        Save
      </button>
      <button
        className="link"
        onClick={() => {
          setFarmEmail(settings?.farmEmail || "");
          setFarmPassword(settings?.farmPassword || "");
          props.onClose();
        }}
      >
        Cancel
      </button>
    </StakeModal>
  );
};
