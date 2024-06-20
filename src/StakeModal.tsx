import { Modal, ModalProps } from "react-responsive-modal";

export const StakeModal = (props: ModalProps) => (
  <Modal
    styles={{
      modal: {
        backgroundColor: "#000000AA",
        backdropFilter: "blur(10px)",
        borderRadius: "5px",
      },
    }}
    {...props}
  />
);
