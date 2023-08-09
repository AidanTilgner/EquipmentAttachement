import { useCallback, useEffect, useState } from "react";
import styles from "./MOLLE.module.scss";

interface IMOLLEGridProps {
  rows: number;
  columns: number;
}

interface Attachment {
  id: string;
  startCoord: { x: number; y: number };
  endCoord: { x: number; y: number };
  dimensions: { height: number; width: number };
}

type MOLLETypes = "standard" | "laser_cut";

function MOLLEGrid({ rows, columns }: IMOLLEGridProps) {
  const [molleType] = useState<MOLLETypes>("standard");

  const [attachments, setAttachments] = useState<Attachment[]>([]);

  const [filledMatrix, setFilledMatrix] = useState<boolean[][]>([]);

  const cellIsFilled = useCallback(
    (x: number, y: number) => {
      if (filledMatrix.length > 0) {
        return filledMatrix[y][x];
      }
      return false;
    },
    [filledMatrix]
  );

  const cellIsFilledFromAttachments = useCallback(
    (x: number, y: number) => {
      if (attachments) {
        for (const attachment of attachments) {
          if (
            x >= attachment.startCoord.x &&
            x <= attachment.endCoord.x &&
            y >= attachment.startCoord.y &&
            y <= attachment.endCoord.y
          ) {
            return true;
          }
        }
      }
      return false;
    },
    [attachments]
  );

  const generateFilledMatrix = useCallback(() => {
    const filled: boolean[][] = [];
    for (let i = 0; i < rows; i++) {
      filled[i] = [];
      for (let j = 0; j < columns; j++) {
        filled[i][j] = cellIsFilledFromAttachments(i, j);
      }
    }
    return filled;
  }, [columns, rows, cellIsFilledFromAttachments]);

  useEffect(() => {
    setFilledMatrix(generateFilledMatrix());
  }, [attachments, generateFilledMatrix]);

  const checkAttachmentAllowed = useCallback(
    (attachment: Attachment) => {
      // check if new attachment would be within bounds of grid
      if (
        attachment.startCoord.x < 0 ||
        attachment.startCoord.y < 0 ||
        attachment.endCoord.x > columns ||
        attachment.endCoord.y > rows
      ) {
        console.error(
          "Attachment out of bounds",
          attachment,
          "Allowed bounds: ",
          {
            x: 0,
            y: 0,
            width: columns,
            height: rows,
          }
        );
        return false;
      }
      // check if attachment overlaps with existing attachments
      if (attachments) {
        for (const existingAttachment of attachments) {
          if (
            attachment.startCoord.x < existingAttachment.endCoord.x &&
            attachment.endCoord.x > existingAttachment.startCoord.x &&
            attachment.startCoord.y < existingAttachment.endCoord.y &&
            attachment.endCoord.y > existingAttachment.startCoord.y
          ) {
            console.error(
              "Attachment overlaps with existing attachment",
              attachment,
              existingAttachment
            );
            return false;
          }
        }
      }
      return true;
    },
    [attachments, columns, rows]
  );

  const addAttachment = useCallback(
    (attachment: Attachment) => {
      console.log("Attempting to add attachment", attachment);
      const allowed = checkAttachmentAllowed(attachment);
      if (!allowed) {
        window.alert("You can't put an attachment there!");
        return;
      }
      setAttachments([...attachments, attachment]);
    },
    [attachments, checkAttachmentAllowed]
  );

  const gridCoordsToElementCoords = useCallback(
    ({ x, y }: { x: number; y: number }) => {
      const cell = document.getElementById(`cell-${y}-${x}`);

      if (!cell) {
        return null;
      }

      const { left, top } = cell.getBoundingClientRect();

      return {
        left,
        top,
      };
    },
    []
  );

  const getMOLLETypeRowsFromHeight = useCallback(
    (height: number) => {
      if (molleType === "standard") {
        return height * 2 - 1;
      }
      return height;
    },
    [molleType]
  );

  const displayAttachments = useCallback(() => {
    const attachmentElements: JSX.Element[] = [];
    attachments.forEach((att) => {
      const dimensions = att.dimensions;
      const startingPosition = gridCoordsToElementCoords({
        x: att.startCoord.x,
        y: att.startCoord.y,
      });

      if (!startingPosition) {
        return;
      }

      const leftFluff = 3;
      const topFluff = 1;

      const attachmentEl = (
        <div
          key={att.id + att.startCoord.y + att.startCoord.x}
          className={`${styles.attachment}`}
          id={att.id}
          style={{
            left: startingPosition.left + leftFluff,
            top: startingPosition.top + topFluff,
            width: `${dimensions.width * 1.5}in`,
            height: `${getMOLLETypeRowsFromHeight(dimensions.height)}in`,
          }}
        >
          {att.id}
        </div>
      );
      attachmentElements.push(attachmentEl);
    });
    return attachmentElements;
  }, [attachments, getMOLLETypeRowsFromHeight, gridCoordsToElementCoords]);
  const [dragDetected, setDragDetected] = useState(false);

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.currentTarget.classList.remove(styles.dragover);
      setDragDetected(false);
      const name = e.dataTransfer.getData("name");
      const dimensions = JSON.parse(e.dataTransfer.getData("dimensions"));
      const cell = e.target as HTMLDivElement;
      if (!cell) {
        return;
      }
      const cellCoords = cell.dataset.coords?.split("-");
      if (!cellCoords) {
        return;
      }
      const cellX = parseInt(cellCoords[1]);
      const cellY = parseInt(cellCoords[0]);
      const attachment: Attachment = {
        id: name,
        dimensions,
        startCoord: { x: cellX, y: cellY },
        endCoord: {
          x: cellX + dimensions.width - 1,
          y: cellY + dimensions.height - 1,
        },
      };
      addAttachment(attachment);
    },
    [addAttachment]
  );

  function buildGrid() {
    const grid: JSX.Element[] = [];

    for (let i = 0; i < rows; i++) {
      const row: JSX.Element[] = [];

      for (let j = 0; j < columns; j++) {
        row.push(
          <div
            className={`${styles.cell} ${
              cellIsFilled(i, j) ? styles.filled : styles.unfilled
            }`}
            key={`cell-${i}-${j}`}
            id={`cell-${i}-${j}`}
            data-coords={`${i}-${j}`}
            onDrop={handleDrop}
            onDragOver={(e) => {
              e.preventDefault();
              e.currentTarget.classList.add(styles.dragover);
            }}
            onDragLeave={(e) => {
              e.currentTarget.classList.remove(styles.dragover);
            }}
          >{`${i}-${j}`}</div>
        );
      }

      grid.push(
        <div className={styles.row} key={`row-${i}`}>
          {row}
        </div>
      );
    }

    return grid;
  }

  return (
    <div className={styles.mollegrid} id="mollegrid">
      <div className={styles.molle}>{buildGrid()}</div>
      {!dragDetected && (
        <div
          className={styles.attachmentsoverlay}
          onDragOver={() => setDragDetected(true)}
        >
          {displayAttachments()}
        </div>
      )}
    </div>
  );
}

export default MOLLEGrid;
