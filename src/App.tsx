import CatchingPokemonOutlinedIcon from "@mui/icons-material/CatchingPokemonOutlined";
import OutlinedFlagOutlinedIcon from "@mui/icons-material/OutlinedFlagOutlined";
import { Box, Button, TextField, Tooltip, Typography } from "@mui/material";
import { useMemo, useReducer, useState } from "react";
import { MinesweeperCell, MinesweeperBoard, CellState, GameState, GameDifficulty } from "./Minesweeper";
import styled from "@emotion/styled";

const useForceUpdater = () => {
    const [_, forceUpdate] = useReducer((x) => x + 1, 0);
    return [forceUpdate];
};

const PulsingBox = styled(Box)`
    @keyframes pulse {
        0%,
        100% {
            background-color: #ffae96;
        }
        50% {
            background-color: #ff0000;
        }
    }
    animation: pulse 2s infinite;
`;

export interface IControlProps {
    onReset: (size: number) => void;
}

export const Controls = ({ onReset }: IControlProps) => {
    const [size, setSize] = useState(10);
    return (
        <Box sx={{ display: "flex", flexDirection: "row" }}>
            <TextField
                defaultValue={10}
                sx={{
                    input: {
                        color: "white",
                        borderColor: "white",
                    },
                    "& label.Mui-focused": {
                        color: "white",
                    },
                    "& .MuiOutlinedInput-root": {
                        "& fieldset": {
                            borderColor: "white",
                        },
                        "&:hover fieldset": {
                            borderColor: "white",
                        },
                        "&.Mui-focused fieldset": {
                            borderColor: "white",
                        },
                    },
                }}
                type="number"
                size="small"
                onChange={(e) => setSize(parseInt(e.target.value))}
            ></TextField>
            <Button
                color="warning"
                onClick={() => {
                    onReset(size);
                }}
            >
                Reset
            </Button>
        </Box>
    );
};

const getCellTextColour = (minesNear: number): string => {
    if (minesNear === 1) {
        return "#e0c31f";
    } else if (minesNear === 2) {
        return "#d1902e";
    } else {
        return "#ff0000";
    }
};

export interface ICellProps {
    cellSize: number;
    cell: MinesweeperCell;
    maxSize: number;
    gapSize: number;
    colour: string;
    hoverColour: string;
    onClick?: (cell: MinesweeperCell) => void;
    onContextMenu?: (cell: MinesweeperCell) => void;
}

export const Cell = ({ cellSize, cell, maxSize, gapSize, colour, hoverColour, onClick, onContextMenu }: ICellProps) => {
    return (
        <Box
            sx={{
                userSelect: "none",
                ml: cell.j === 0 ? gapSize : 0.5 * gapSize,
                mr: cell.j === maxSize - 1 ? gapSize : 0.5 * gapSize,
                width: cellSize,
                height: cellSize,
                backgroundColor: colour,
                "&:hover": {
                    backgroundColor: hoverColour,
                },
            }}
            onClick={() => {
                if (onClick) onClick(cell);
            }}
            onContextMenu={(e) => {
                e.preventDefault();
                if (onContextMenu) onContextMenu(cell);
            }}
        >
            {cell.state === CellState.Marked && <OutlinedFlagOutlinedIcon style={{ color: "white" }} />}
            {cell.state === CellState.Mine && (
                <PulsingBox sx={{ width: cellSize, height: cellSize }}>
                    <CatchingPokemonOutlinedIcon style={{ color: "white" }} />
                </PulsingBox>
            )}
            {cell.state === CellState.Number && (
                <Box
                    sx={{
                        backgroundColor: hoverColour,
                        width: cellSize,
                        height: cellSize,
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                    }}
                >
                    <Typography color={getCellTextColour(cell.minesNear)}>{cell.minesNear > 0 ? cell.minesNear : ""}</Typography>
                </Box>
            )}
        </Box>
    );
};

export interface IBoardProps {
    board: MinesweeperBoard;
    cellSize?: number;
    gapSize?: number;
}

export const getCellIterator = (size: number) => {
    return Array.from(Array(size));
};

export const Board = ({ board, cellSize = 25, gapSize = 0.25 }: IBoardProps) => {
    const gapColour = "#aaaaaa";
    const cellColour = "#424242";
    const cellHoverColour = "#727272";

    const [forceUpdate] = useForceUpdater();

    const onCellClicked = (cell: MinesweeperCell) => {
        board.clickCell(cell.i, cell.j);
        forceUpdate();
    };

    const onCellContextMenu = (cell: MinesweeperCell) => {
        board.markCell(cell.i, cell.j);
        forceUpdate();
    };

    return (
        <Box sx={{ display: "flex", mt: 1, flexDirection: "column", alignItems: "center" }}>
            <Box key="board" sx={{ display: "flex", flexDirection: "column", backgroundColor: gapColour }}>
                {getCellIterator(board.size).map((_, rowIndex) => {
                    return (
                        <Box
                            key={`row${rowIndex}`}
                            sx={{
                                display: "flex",
                                flexDirection: "row",
                                mt: rowIndex === 0 ? gapSize : 0.5 * gapSize,
                                mb: rowIndex === board.size - 1 ? gapSize : 0.5 * gapSize,
                            }}
                        >
                            {getCellIterator(board.size).map((_, colIndex) => {
                                const cell = board.getCell(rowIndex, colIndex);
                                if (cell === undefined) return <></>;
                                return (
                                    <Cell
                                        key={`${cell.i},${cell.j}`}
                                        colour={cellColour}
                                        hoverColour={cellHoverColour}
                                        cellSize={cellSize}
                                        cell={cell}
                                        maxSize={board.size}
                                        gapSize={gapSize}
                                        onClick={onCellClicked}
                                        onContextMenu={onCellContextMenu}
                                    />
                                );
                            })}
                        </Box>
                    );
                })}
            </Box>
            <Tooltip title="Mines Remaining">
                <Typography
                    sx={{
                        display: "flex",
                        alignItems: "center",
                        flexWrap: "wrap",
                        mt: 1,
                    }}
                    color="white"
                >
                    <CatchingPokemonOutlinedIcon style={{ color: "white" }} />
                    {`: ${board.minesRemaining}`}
                </Typography>
            </Tooltip>
        </Box>
    );
};

function App() {
    const [forceReset, setForceReset] = useState(false);
    const [boardSize, setBoardSize] = useState(10);
    const [state, setState] = useState(GameState.InProgress);
    const onStateChanged = (state: GameState) => {
        setState(state);
    };
    const board = useMemo(() => new MinesweeperBoard(boardSize, GameDifficulty.Easy, onStateChanged), [boardSize, forceReset]);

    const onReset = (size: number) => {
        setBoardSize(size);
        setForceReset((r) => !r);
        setState(GameState.InProgress);
    };

    return (
        <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
            <Controls onReset={onReset} />
            <Board board={board} />
            {(state === GameState.Win || state === GameState.Lose) && (
                <Typography variant="h4" color={state === GameState.Win ? "green" : "red"} sx={{ mt: 1 }}>
                    {state === GameState.Win ? "You Win!" : "DETONATION!!!"}
                </Typography>
            )}
        </Box>
    );
}

export default App;
