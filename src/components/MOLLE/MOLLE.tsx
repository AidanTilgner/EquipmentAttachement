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
}

function MOLLEGrid({ rows, columns }: IMOLLEGridProps) {
  const [attachments, setAttachments] = useState<Attachment[]>([
    {
      id: "test",
      startCoord: { x: 0, y: 0 },
      endCoord: { x: 1, y: 1 },
    },
  ]);

  const [filledMatrix, setFilledMatrix] = useState<boolean[][]>([]);

  const cellIsFilled = useCallback(
    (x: number, y: number) => {
      if (filledMatrix.length > 0) {
        return filledMatrix[x][y];
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
    },
    [attachments, columns, rows]
  );

  const addAttachment = useCallback(
    (attachment: Attachment) => {
      const allowed = checkAttachmentAllowed(attachment);
      if (!allowed) {
        return;
      }
      setAttachments([...attachments, attachment]);
    },
    [attachments, checkAttachmentAllowed]
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

  const getAttachment = useCallback(
    (id: string) => {
      if (attachments) {
        for (const attachment of attachments) {
          if (attachment.id === id) {
            return attachment;
          }
        }
      }
    },
    [attachments]
  );

  const getAttachmentBoundingBox = useCallback(
    (id: string) => {
      const attachment = getAttachment(id);
      if (!attachment) {
        console.error("Attachment with id", id, "not found");
        return undefined;
      }
      const { startCoord, endCoord } = attachment;

      const startCell = document.getElementById(
        `cell-${startCoord.x}-${startCoord.y}`
      );
      const endCell = document.getElementById(
        `cell-${endCoord.x}-${endCoord.y}`
      );

      if (!startCell || !endCell) {
        console.error("One or more cells not found for attachment", attachment);
        return undefined;
      }

      const startCellRect = startCell.getBoundingClientRect();
      const endCellRect = endCell.getBoundingClientRect();

      console.log(
        "Rects: ",
        startCell.innerHTML,
        startCellRect,
        endCell.innerHTML,
        endCellRect
      );

      return {
        top: startCellRect.top,
        left: startCellRect.left,
        right: endCellRect.right,
        bottom: endCellRect.bottom,
      };
    },
    [getAttachment]
  );

  /**
    DOMRect { x: 387.5, y: 74, width: 147, height: 96, top: 74, right: 534.5, bottom: 170, left: 387.5 }
    DOMRect { x: 534.5, y: 266, width: 147, height: 96, top: 266, right: 681.5, bottom: 362, left: 534.5 }
   */

  const displayAttachments = useCallback(() => {
    const attachmentElements: JSX.Element[] = [];
    if (attachments) {
      for (const attachment of attachments) {
        const boundingBox = getAttachmentBoundingBox(attachment.id);
        if (!boundingBox) {
          continue;
        }
        const { top, left, bottom, right } = boundingBox;
        attachmentElements.push(
          <div
            className={styles.attachment}
            key={`attachment-${attachment.id}`}
            style={{
              top: top,
              left: left,
              bottom: bottom,
              right: right,
            }}
          >
            {attachment.id}
          </div>
        );
      }
    }
    return attachmentElements;
  }, [attachments, getAttachmentBoundingBox]);

  document.body.appendChild(
    document.createElement("div").classList.add("test")
  );

  return (
    <div className={styles.mollegrid}>
      <div className={styles.molle}>{buildGrid()}</div>
      <div className={styles.attachmentsoverlay}>{displayAttachments()}</div>
    </div>
  );
}

export default MOLLEGrid;
