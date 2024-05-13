import { useState, useEffect } from "react";
import styled from "styled-components";
import { useSearchParams } from "react-router-dom";
import axios from "axios";
import { io } from "socket.io-client";
import { toast, Toaster } from "react-hot-toast";
import BingoCard from "../Lobby/bingo_card";
import ConfirmationDialog from "../Main/confirm_dialog";
import BingoSheet from "../Main/bingo_sheet";
import selectBannerIMG from "../../assets/game/select_banner.png";
import card1DisplayIMG from "../../assets/game/card_selection/card1display.png";
import addIMG from "../../assets/game/add.png";
import subtractIMG from "../../assets/game/subtract.png";

const GAMESTATE = Object.freeze({
  idle: "idle",
  findingMatch: "findingMatch",
  inLobby: "inLobby",
  cardSelected: "cardSelected",
  playing: "playing",
  shopping: "shopping",
  redeeming: "redeeming",
  gameFinished: "gameFinished",
  findingLobby: "findingLobby",
  withdrawing: "withdrawing",
});

const randomNumber = () => Math.floor(Math.random() * 75) + 1;

let hostip = "localhost:8080";
// let hostip = "igamez.site";

const Lobby = () => {
  let [useParams] = useSearchParams();
  let [lobbyId, setLobbyId] = useState(null);
  let [socket, setSocket] = useState(null);
  let jwtToken = localStorage.getItem("token");
  let [gameState, setGameState] = useState("cardSelected");
  let [cards, setcards] = useState(null);
  let [lobby, setLobby] = useState(null);
  let [price, setPrice] = useState(0);
  let [letter, setLetter] = useState("");
  let [number, setNumber] = useState(0);
  let [cardsToUse, setCardsToUse] = useState(1);
  let [isShaking, setIsShaking] = useState(false);
  let [availableCards, setAvailableCards] = useState(null);
  let [selectConfirmDialog, setSelectConfirmDialog] = useState(false);
  let [userID, setuserID] = useState(null);
  // let [cards, setCards] = useState([
  //   {
  //     numbers: [
  //       [14, 1, 13, 10, 15],
  //       [24, 25, 30, 16, 19],
  //       [36, 31, 0, 37, 44],
  //       [47, 53, 58, 52, 49],
  //       [68, 66, 63, 70, 64],
  //     ],
  //   },
  // ]);

  // let [lobby, setLobby] = useState({
  //   gameNumbers: [16, 18],
  // });

  const lobbyJoin = async () => {
    await axios.patch(
      `/api/lobby/${useParams.get("lobby_id")}/join`,
      { cards: 2 },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${jwtToken}`,
        },
      }
    );
    socket.emit("join-lobby", {
      token: jwtToken,
      lobbyID: useParams.get("lobby_id"),
    });
    socket.emit("card-selected", {
      userID: "658e48665b45dd45938cbe93",
      numOfCards: 2,
    });
  };

  useEffect(() => {
    const newSocket = io(`ws://${hostip}`, {
      path: "/socket.io",
      secure: true,
      rejectUnauthorized: false,
    });
    setSocket(newSocket);
    return () => newSocket.close();
  }, []);

  useEffect(() => {
    if (socket) {
      lobbyJoin();
    }
  }, [socket]);

  useEffect(() => {
    if (socket) {
      const lobbyJoin = (result) => {
        setPrice(result.price);
        setLobby(result.lobby);
        setGameState(GAMESTATE.inLobby);
        setuserID(result.userID);
        socket.emit("join", {
          token: jwtToken,
          lobbyID: result.lobby._id,
        });
      };
      socket.on("lobby-joined", lobbyJoin);

      if (userID) {
        socket.on("game-start", (result) => {
          const members = result.lobby.members;
          const member = members.find((member) => {
            return member._id == userID;
          });
          setcards(member.bingoCards);
        });
      }

      return () => {
        socket.off("lobby-joined", lobbyJoin);
      };
    }
  }, [socket]);

  return (
    <>
      <Toaster position="top-right" reverseOrder={false} />
      <div className="w-full h-auto min-h-screen bg-center bg-no-repeat bg-cover bg-background-image">
        <div className="px-3 pt-8">
          <div className="grid items-center justify-center grid-cols-1 gap-3 md:grid-cols-3">
            <div className="flex items-center justify-end md:justify-start">
              <LobbyLeave className=" md:mb-0 mb-7">
                <button
                // onClick={handleLeave}
                >
                  Leave
                </button>
              </LobbyLeave>
            </div>
            <RollAnimation className="flex items-center justify-center gap-2 ">
              <div className="box">
                <p className="text-2xl ">{/* {letter} */}</p>
              </div>
              {/* <div className={`box ${isShaking ? "shake" : ""}`}> */}
              <div>
                <p className="text-2xl ">{/* {number} */}</p>
              </div>
              <div className="flex flex-col gap-1 text-center ">
                <p className="text-sm text-black ">Price</p>
                <p className="text-lg text-black ">{/* {price} */}</p>
              </div>

              {/* {lobby.timer_date_time && (
                    <Timer
                      startDateTime={lobby.timer_date_time}
                      durationInSeconds={10}
                      onTimeout={onLobbyTimeout}
                      onResume={onLobbyResume}
                    />
                  )} */}
            </RollAnimation>
            {/* <div className="flex items-center justify-center md:justify-end">
                  <BingoSubmit className="">
                    {lobby.winners.length > 0 && (
                      <button onClick={handleShowWinners}>Show Winner List</button>
                    )}
                    {gotBingo && !bingoWinningsSubmitted && !lobbyTimeout && (
                      <button onClick={submitBingo}>Submit Bingo</button>
                    )}
                  </BingoSubmit>
                </div> */}
          </div>
          <div className=" w-full pt-4 md:pt-14 grid grid-cols-1 gap-4 lg:grid-cols-[60%__1fr]">
            <div className="grid w-full grid-cols-1 gap-4 md:grid-cols-2 auto-rows-max">
              {cards &&
                cards.map((card, index) => {
                  return (
                    <BingoCard
                      numbers={card.numbers}
                      generatedNumbers={lobby.gameNumbers}
                      key={`card_${index}`}
                      //   onTableToggle={checkWinnings}
                    />
                  );
                })}
            </div>
            <div className="flex w-full md:justify-end">
              {/* <BingoSheet generatedNumbers={lobby.gameNumbers} /> */}
            </div>
            {/* {leaveConfirmDialog && (
                  <ConfirmationDialog
                    title={"Are you sure?"}
                    message={"You are about to leave the lobby"}
                    onConfirm={leave}
                    handleClose={handleDialogClose}
                  />
                )} */}
            {/* {showWinners && (
                  <WinnersList>
                    <div className="container">
                      <button className="close" onClick={closeWinnerList}>
                        X
                      </button>
                      <Winners winners={lobby.winners} />
                    </div>
                  </WinnersList>
                )} */}

            {/* {showPlayerWon != null && (
                  <div className="fixed inset-0 bg-black bg-opacity-80">
                    <PlayerWinnings>
                      <h2>You Won!</h2>
                      <p className="winning_amount">
                        {parseInt(showPlayerWon.totalWon)} points rewarded!
                      </p>
                      <p className="patternName">
                        Pattern Name: {showPlayerWon.pattern.patternName}
                      </p>
                      <Table
                        grid={showPlayerWon.pattern.pattern}
                        card={showPlayerWon.card}
                      />
                      <button
                        className="winning_close"
                        onClick={() => {
                          setShowPlayerWon(null);
                        }}
                      >
                        Confirm
                      </button>
                    </PlayerWinnings>
                  </div>
                )} */}
          </div>
        </div>
      </div>
    </>
  );
};

export default Lobby;

const LobbyLeave = styled.div`
  button {
    font-size: 1.2em;
    color: white;
    font-weight: 500;
    padding: 0.5em 2em;
    background: linear-gradient(
      90deg,
      rgba(131, 58, 180, 1) 0%,
      rgba(253, 29, 29, 1) 50%,
      rgba(252, 176, 69, 1) 100%
    );
    border-radius: 20px;
    border: none;
  }
`;

const RollAnimation = styled.div`
  @keyframes shake {
    0% {
      transform: translateX(0);
    }
    25% {
      transform: translateY(-5px);
    }
    50% {
      transform: translateY(5px);
    }
    75% {
      transform: translateY(-5px);
    }
    100% {
      transform: translateX(0);
    }
  }

  .shake {
    animation: shake 0.1s infinite;
  }

  div {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 70px;
    height: 70px;
    border-radius: 50%;
    background-color: #f733dc;
    background: rgb(240, 243, 255);
    background: radial-gradient(
      circle,
      rgba(240, 243, 255, 1) 6%,
      rgba(100, 125, 253, 1) 56%,
      rgba(63, 94, 251, 1) 76%,
      rgba(126, 86, 204, 1) 100%,
      rgba(163, 81, 175, 1) 100%,
      rgba(252, 70, 107, 1) 100%
    );
  }
`;

const BingoSubmit = styled.div`
  button {
    font-size: 1.2em;
    color: white;
    font-weight: 500;
    padding: 0.5em 2em;
    background: linear-gradient(
      90deg,
      rgba(131, 58, 180, 1) 0%,
      rgba(253, 29, 29, 1) 50%,
      rgba(252, 176, 69, 1) 100%
    );
    border-radius: 20px;
    border: none;
  }
`;

const LobbyContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 50px;
`;
