import { useEffect, useState, type ReactNode } from "react";
import classes from "./Modal.module.css";

interface ModalProps {
  title: string;
  onClose: () => void;
  children: ReactNode;
}

const Modal = ({ title, onClose, children }: ModalProps) => {
  const [closing, setClosing] = useState(false);

  const requestClose = () => setClosing(true);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") requestClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <div
      className={`${classes.backdrop} ${closing ? classes.closing : ""}`}
      onClick={requestClose}
      onAnimationEnd={(e) => {
        if (closing && e.target === e.currentTarget) onClose();
      }}
    >
      <div className={classes.modal} onClick={(e) => e.stopPropagation()}>
        <div className={classes.header}>
          <h2>{title}</h2>
          <button type="button" className={classes.close} onClick={requestClose} aria-label="Close">
            ×
          </button>
        </div>
        <div className={classes.body}>{children}</div>
      </div>
    </div>
  );
};

export default Modal;
