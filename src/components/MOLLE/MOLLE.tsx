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

type MOLLETypes = "standard" | "laser_cut";

function MOLLEGrid({ rows, columns }: IMOLLEGridProps) {
  const [molleType, setMOLLEType] = useState<MOLLETypes>("standard");

  const [attachments, setAttachments] = useState<Attachment[]>([]);

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

  const gridCoordsToElementCoords = useCallback(
    ({ x, y }: { x: number; y: number }) => {
      const cell = document.getElementById(`cell-${y}-${x}`);

      if (!cell) {
        return null;
      }

      const { x: elX, y: elY } = cell.getBoundingClientRect();

      return {
        left: elX,
        top: elY,
      };
    },
    []
  );

  const computeAttachmentDimensions = useCallback((attachment: Attachment) => {
    const { startCoord, endCoord } = attachment;

    const width = endCoord.x - startCoord.x + 1;
    const height = endCoord.y - startCoord.y + 1;
    return {
      width,
      height,
    };
  }, []);

  /**
    DOMRect { x: 360, y: 74, width: 147, height: 96, top: 74, right: 507, bottom: 170, left: 360 }
    DOMRect { x: 507, y: 266, width: 147, height: 96, top: 266, right: 654, bottom: 362, left: 507 }
   */

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
      const dimensions = computeAttachmentDimensions(att);
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
  }, [
    attachments,
    computeAttachmentDimensions,
    getMOLLETypeRowsFromHeight,
    gridCoordsToElementCoords,
  ]);

  return (
    <div className={styles.mollegrid} id="mollegrid">
      <div className={styles.molle}>{buildGrid()}</div>
      <div className={styles.attachmentsoverlay}>{displayAttachments()}</div>
    </div>
  );
}

export default MOLLEGrid;
