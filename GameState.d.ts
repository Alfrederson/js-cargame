import { GameState } from "./GameState";


type GameEventHandler = (state:GameState) => void;


export { GameState, GameEventHandler }

