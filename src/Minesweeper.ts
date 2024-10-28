export enum CellState {
    Hidden,
    Mine,
    Number,
    Marked,
}

export enum GameState {
    InProgress,
    Win,
    Lose,
}

export enum GameDifficulty {
    Easy = 10,
    Medium = 30,
    Hard = 50,
    Extreme = 70,
}

export class MinesweeperCell {
    public minesNear = 0;
    constructor(public readonly i: number, public readonly j: number, public state: CellState, public readonly isMine: boolean) {}
}

export class MinePositionGenerator {
    private static randomInRange(size: number): number {
        return Math.floor(Math.random() * size);
    }
    public static generate(boardSize: number, numMines: number): { i: number; j: number }[] {
        const positions: { i: number; j: number }[] = [];

        while (positions.length < numMines) {
            const pos = {
                i: MinePositionGenerator.randomInRange(boardSize),
                j: MinePositionGenerator.randomInRange(boardSize),
            };

            if (
                !positions.some((p) => {
                    return p.i === pos.i && p.j === pos.j;
                })
            ) {
                positions.push(pos);
            }
        }
        return positions;
    }
}

export class MinesweeperBoard {
    private board: MinesweeperCell[];
    private gameState: GameState = GameState.InProgress;
    private numMines: number;

    constructor(private _size: number, private difficulty: GameDifficulty, private onGameStateChanged: (state: GameState) => void) {
        this.board = [];
        this.numMines = Math.floor(this._size * this._size * (this.difficulty / 100));

        const minePositions = MinePositionGenerator.generate(this._size, this.numMines);
        for (let i = 0; i < _size; i++) {
            for (let j = 0; j < _size; j++) {
                this.board.push(
                    new MinesweeperCell(
                        i,
                        j,
                        CellState.Hidden,
                        minePositions.some((mp) => mp.i === i && mp.j === j)
                    )
                );
            }
        }
    }

    public get gameOver(): boolean {
        return this.gameState === GameState.Win || this.gameState === GameState.Lose;
    }
    private checkWin(): boolean {
        return this.board.filter((c) => c.isMine && c.state === CellState.Marked).length === this.numMines;
    }

    private checkLose(): boolean {
        return this.board.filter((c) => c.state === CellState.Mine).length > 0;
    }

    private checkGameEnd() {
        const win = this.checkWin();
        const lose = this.checkLose();

        if (win) {
            this.gameState = GameState.Win;
            this.onGameStateChanged(this.gameState);
        }

        if (lose) {
            this.gameState = GameState.Lose;
            this.onGameEnd();
            this.onGameStateChanged(this.gameState);
        }
    }

    private revealAllMines(): void {
        this.board.forEach((c) => {
            if (c.isMine) {
                c.state = CellState.Mine;
            }
        });
    }

    private onGameEnd(): void {
        if (this.gameState === GameState.Lose) {
            this.revealAllMines();
        }
    }

    public get size(): number {
        return this._size;
    }

    public get minesRemaining(): number {
        const numMarked = this.board.filter((c) => c.state === CellState.Marked).length;
        return this.numMines - numMarked;
    }

    public getCell(i: number, j: number): MinesweeperCell | undefined {
        if (i >= this._size || j >= this._size) return undefined;
        return this.board[j + this._size * i];
    }

    public get cells(): MinesweeperCell[] {
        return this.board;
    }

    private nearbyTiles(cell: MinesweeperCell) {
        const cells: MinesweeperCell[] = [];

        for (let xOffset = -1; xOffset <= 1; xOffset++) {
            for (let yOffset = -1; yOffset <= 1; yOffset++) {
                const adjacentCell = this.getCell(cell.i + xOffset, cell.j + yOffset);
                if (adjacentCell) {
                    cells.push(adjacentCell);
                }
            }
        }
        return cells;
    }

    public clickCell(i: number, j: number) {
        if (this.gameOver) return;

        const cell = this.getCell(i, j);
        if (cell) {
            if (cell.state !== CellState.Hidden && cell.state !== CellState.Marked) return;

            if (cell.isMine) {
                cell.state = CellState.Mine;
            } else {
                cell.state = CellState.Number;
                const adjacentCells = this.nearbyTiles(cell);
                const mines = adjacentCells.filter((t) => t.isMine);
                if (mines.length === 0) {
                    adjacentCells.forEach((c) => this.clickCell(c.i, c.j));
                } else {
                    cell.minesNear = mines.length;
                }
            }
        }

        this.checkGameEnd();
    }

    public markCell(i: number, j: number) {
        if (this.gameOver) return;

        const cell = this.getCell(i, j);
        if (cell) {
            if (cell.state !== CellState.Hidden && cell.state !== CellState.Marked) return;

            if (cell.state === CellState.Marked) {
                cell.state = CellState.Hidden;
            } else {
                if (this.minesRemaining > 0) cell.state = CellState.Marked;
            }
        }
        this.checkGameEnd();
    }
}
