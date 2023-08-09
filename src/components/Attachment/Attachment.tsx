import React from "react";
import styles from "./Attachment.module.scss";

interface AttachmentProps {
  name: string;
  dimensions: { height: number; width: number };
}

function Attachment({ name, dimensions }: AttachmentProps) {
  const handleDragStart = (event: React.DragEvent<HTMLDivElement>) => {
    event.dataTransfer?.setData("dimensions", JSON.stringify(dimensions));
    event.dataTransfer?.setData("name", name);
  };

  return (
    <div
      className={styles.attachment}
      draggable
      onDragStart={handleDragStart}
      style={{
        width: `${dimensions.width * 1.5}in`,
        height: `${dimensions.height * 1}in`,
      }}
    >
      <div className={styles.attachmentName}>{name}</div>
    </div>
  );
}

export default Attachment;
