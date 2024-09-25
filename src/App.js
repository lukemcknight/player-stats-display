import React, { useState, useEffect } from 'react';
import { Button, ToggleButton, ButtonGroup } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';
import './App.css';
import axios from 'axios';


function getDate() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const date = String(today.getDate() - 1).padStart(2, '0');
  return `${year}${month}${date}`;
}

const App = () => {
  const [gameId, setGameId] = useState("")
  const [gambleTypeValue, setGambleTypeValue] = useState(1)
  const [playerName, setPlayerName] = useState("");
  const [numOfStat, setNumOfStat] = useState(0);
  const [betSlips, setBetSlips] = useState([]);
  const [games, setGames] = useState([]);
  const [data, setData] = useState(null);
  const [nextId, setNextId] = useState(1);
  const [selectedGameTitle, setSelectedGameTitle] = useState("Select Game")
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(null);

  const gambleTypes = [
    { name: 'Passing Yards', value: '1' },
    { name: 'Rec Yards', value: '2' },
    { name: 'Rush Yards', value: '3' },
    { name: 'Rec TDs', value: '4' },
    { name: 'Rush TDs', value: '5' },
    { name: 'Passing TDs', value: '6' },
    { name: 'Receptions', value: '7'}
  ]

  const date = getDate();

  useEffect(() => {
    const savedBetSlips = localStorage.getItem('betSlips')
    if(savedBetSlips) {
      setBetSlips(JSON.parse(savedBetSlips))
      const savedId = localStorage.getItem('nextId')
      if(savedId) {
        setNextId(parseInt(savedId, 10))
      }
    }
  }, [])

  useEffect(() => {
    if (betSlips.length > 0) {
      localStorage.setItem('betSlips', JSON.stringify(betSlips))
    }
    localStorage.setItem('nextId', nextId)
  }, [betSlips, nextId])

  const fetchGameData = async () => {
    const options = {
      method: 'GET',
      url: 'https://tank01-nfl-live-in-game-real-time-statistics-nfl.p.rapidapi.com/getNFLGamesForDate',
      params: {
        gameDate: date
      },
      headers: {
        'x-rapidapi-key': 'c1a0bf9d10msh7c951b21baaaf02p1de69bjsn95eef6c80448',
        'x-rapidapi-host': 'tank01-nfl-live-in-game-real-time-statistics-nfl.p.rapidapi.com'
      }
    };
    
    try {
      const response = await axios.request(options);

      console.log(response.data);

      setGames(response.data.body)
    } catch (error) {
      console.error(error);
    }
  }

  const fetchStatsData = async () => {
    const options = {
        method: 'GET',
        url: 'https://tank01-nfl-live-in-game-real-time-statistics-nfl.p.rapidapi.com/getNFLBoxScore',
        params: {
          gameID: gameId,
        },
        headers: {
          'x-rapidapi-key': 'c1a0bf9d10msh7c951b21baaaf02p1de69bjsn95eef6c80448',
          'x-rapidapi-host': 'tank01-nfl-live-in-game-real-time-statistics-nfl.p.rapidapi.com'
        }
    };
    
    try {
        const response = await axios.request(options);

        console.log(response)

        setData(response.data.body.playerStats);
    } catch (error) {
        setError(error);
    } finally {
        setLoading(false);
    }
  };

  useEffect(() => {
    fetchGameData();
  }, [])

  useEffect(() => {
    if (gameId) {
      fetchStatsData();
    }
  }, [gameId]);

  useEffect(() => {
    console.log(games);
  }, [games])

  const handleSubmit = () => {
    const query = playerName.toLowerCase()
    let found = false;

    if(data && typeof data === 'object') {
      for (let key in data) {
        const playerData = data[key];
        console.log(`Inspecting key: ${key}`, playerData);
  
        if(playerData && playerData.longName && playerData.longName.toLowerCase().includes(query)) {
          let playerStats;

          if(gambleTypeValue == 1) {
            playerStats = playerData.Passing?.passYds ?? "No Data";
          } else if (gambleTypeValue == 2) {
            playerStats = playerData.Receiving?.recYds ?? "No Data";
          } else if(gambleTypeValue == 3) {
            playerStats = playerData.Rushing?.rushYds ?? "No Data";
          } else if(gambleTypeValue == 4) {
            playerStats = playerData.Receiving?.recTD ?? "No Data";
          } else if(gambleTypeValue == 5) {
            playerStats = playerData.Rushing?.rushTD ?? "No Data";
          } else if(gambleTypeValue == 6) {
            playerStats = playerData.Passing?.passTD ?? "No Data";
          } else {
            playerStats = playerData.Receiving?.receptions ?? "No Data";
          }


          setBetSlips(prev => [
            ...prev,
            { id: nextId, name: playerData.longName, statNum: numOfStat, statType: gambleTypeValue, playerStats : playerStats}
          ])
          setNextId(prev => prev + 1)
          setPlayerName("")
          setNumOfStat(0)
          found = true
          break
        }
      }
      if (!found) {
        alert("Player not found")
      }

    } else {
      console.error("Player data is not available or in an unexpected format.")
    }
  } 

  const handleDelete = (id) => {
    const updateBetSlips = betSlips.filter(betSlip => betSlip.id !== id)
    setBetSlips(updateBetSlips)
    localStorage.setItem('betSlips', JSON.stringify(updateBetSlips))
  }

  const handleGame = (gameIdx) => {
    const selectedGame = games[gameIdx]
    if (selectedGame) {
      setGameId(selectedGame.gameID);
      setSelectedGameTitle(`${selectedGame.away} @ ${selectedGame.home}`)
      console.log(selectedGame.gameID)
    }
  }

  return (
    <div className="p-3 mb-2 text-white bg-secondary full-screen dm-sans-bold">
      <h2 className='text-center dm-sans-bold'>Stat Display</h2>
      <h3 className='dm-sans-bold'>Game</h3>
      <button className="btn btn-info dropdown-toggle dm-sans-bold" type="button" data-bs-toggle="dropdown" aria-expanded="false">
        {selectedGameTitle}
      </button>
      <ul className="dropdown-menu dm-sans-bold">
      {Array.isArray(games) && games.length > 0 ? (
        games.map((game, idx) => (
          <li className="dm-sans-bold" key={game.gameID || idx}>
            <button className="dropdown-item dm-sans-bold" onClick={() => handleGame(idx)}>
              {game.away} @ {game.home}
            </button>
          </li>
        ))
      ) : (
        <li className='dm-sans-bold'>No games today</li>
      )}
      </ul>
      <h3 className='dm-sans-bold'>Player Name</h3>
      <input type='text' value={playerName} onChange={(e) => setPlayerName(e.currentTarget.value)}></input>
      <h3 className='dm-sans-bold'>Stat:</h3>
      <ButtonGroup>
        <button className='btn btn-info dropdown-toggle dm-sans-bold' type='button' data-bs-toggle="dropdown" aria-expanded="false">
          Stat Type
        </button>
        <ul className='dropdown-menu list-unstyled'>
        {gambleTypes.map((gambleType, idx) => (
          <li key={idx}>
            <ToggleButton
              className='dropdown-item dm-sans-bold'
              id={`gambleType-${idx}`}
              type="radio"
              variant={'primary'}
              name="gambleType"
              value={gambleType.value}
              checked={gambleTypeValue === gambleType.value}
              onChange={(e) => setGambleTypeValue(e.currentTarget.value)}
            >
              {gambleType.name}
            </ToggleButton>
          </li>
        ))}
        </ul>
      </ButtonGroup>
      <h3 className='dm-sans-bold'>Number of {(gambleTypeValue == 1 || gambleTypeValue == 2 || gambleTypeValue == 3) 
        ? "Yards" 
        : (gambleTypeValue == 4 || gambleTypeValue == 5 || gambleTypeValue == 6) 
        ? "TDs" 
        : "Receptions"}
      </h3> 
      <input type='number' value={numOfStat} onChange={(e) => setNumOfStat(e.currentTarget.value)}></input>
      <Button className="m-1 dm-sans-bold" variant="info" type="submit" onClick={handleSubmit}>Submit</Button>
      <div>
        <ul className='list-group'>
        {Array.isArray(betSlips) && betSlips.length > 0 ? betSlips.map(betSlip => 
          <li className={`list-group-item ${Number(betSlip.playerStats) > Number(betSlip.statNum) ? 'list-group-item-success' : 'list-group-item-warning'}`} key={betSlip.id}>
            <h2 className='dm-sans-bold'>{betSlip.name}</h2>
            <h2 className='dm-sans-bold'>{betSlip.playerStats}/{betSlip.statNum}</h2>
            <h2 className='dm-sans-bold'>{(betSlip.statType == 1 || betSlip.statType == 2 || betSlip.statType == 3) 
              ? "Yards" 
              : (betSlip.statType == 4 || betSlip.statType == 5 || betSlip.statType == 6) 
              ? "TDs" 
              : "Receptions"}
            </h2>
            <Button className="dm-sans-bold" variant="danger" type="submit" onClick={() => handleDelete(betSlip.id)}>Delete</Button>
          </li>
        ) : <li className='list-group-item dm-sans-bold'>No stats searched yet.</li>}
        </ul>
      </div>
    </div>
  );
}

export default App;

