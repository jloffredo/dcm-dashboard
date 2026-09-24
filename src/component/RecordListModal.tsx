import type { ReactNode } from "react";
import Modal from "./Modal.tsx";
import classes from "./RecordListModal.module.css";

export interface Column<T> {
  header: string;
  render: (item: T) => ReactNode;
}

interface RecordListModalProps<T> {
  title: string;
  items: T[];
  columns: Column<T>[];
  onClose: () => void;
}

function RecordListModal<T>({ title, items, columns, onClose }: RecordListModalProps<T>) {
  return (
    <Modal title={title} onClose={onClose}>
      {items.length ? (
        <div className={classes.tableWrapper}>
          <table className={classes.table}>
            <thead>
              <tr>
                {columns.map((column) => (
                  <th key={column.header}>{column.header}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items.map((item, i) => (
                <tr key={i}>
                  {columns.map((column) => (
                    <td key={column.header}>{column.render(item)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p>No records found.</p>
      )}
    </Modal>
  );
}

export default RecordListModal;
