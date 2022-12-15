import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import { Peer } from "peerjs";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { solid, regular, brands, icon } from '@fortawesome/fontawesome-svg-core/import.macro'

function Square(props) {
  return (
    <button className="square" onClick={props.onClick} disabled={!props.myTurn}>
      {props.value}
    </button>
  );
}

class Board extends React.Component {
  constructor(props) {
    super(props);
  }

  renderSquare(i) {
    return <Square value={this.props.squares[i]}
                   onClick={() => this.props.handleClick(i)}
                   myTurn={this.props.myTurn}
           />;
  }

  render() {
    return (
      <div>
        <div className="board-row">
          {this.renderSquare(0)}
          {this.renderSquare(1)}
          {this.renderSquare(2)}
        </div>
        <div className="board-row">
          {this.renderSquare(3)}
          {this.renderSquare(4)}
          {this.renderSquare(5)}
        </div>
        <div className="board-row">
          {this.renderSquare(6)}
          {this.renderSquare(7)}
          {this.renderSquare(8)}
        </div>
      </div>
    );
  }
}

class ConnectionPanel extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      fieldValue: ""
    };
    this.handleChange = this.handleChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  handleChange(event) {
    this.setState({fieldValue: event.target.value});
  }

  handleSubmit(event) {
    event.preventDefault(); // prevents page refresh
    this.props.connectToID(this.state.fieldValue);
  }

  render() {
    return (
      <div>
        <span>
          Your peer ID: {this.props.myID ? this.props.myID : "waiting"}
        </span>
        <form onSubmit={this.handleSubmit}>
          <label>
            Connect to ID:
            <textarea value={this.state.fieldValue} onChange={this.handleChange}/>
          </label>
          <input type="submit" value="Submit" />
        </form>
      </div>
    );
  }
}

class UI extends React.Component {
  constructor(props) {
    super(props);
    // see https://reactjs.org/docs/forms.html
    this.connectToID = this.connectToID.bind(this);
    this.handleClick = this.handleClick.bind(this);
    this.receiveConnection = this.receiveConnection.bind(this);
    const p = new Peer();
    p.on('open', (id) => {
      this.setState({
        myID: id,
      });
    });
    p.on('connection', this.receiveConnection);
    this.state = {
      peer: p,
      myID: null,
      friendID: null,
      isX: null,
      conn: null,
      squares: Array(9).fill(null),
      xIsNext: true,
    };
  }

  handleClick(i) {
    if(!this.myTurn()) {
      // if we get here, something's gone wrong
      console.log("click triggered even though it's not our turn")
      return
    }
    this.doMove(i);
  }

  myTurn() {
    return (this.state.isX == this.state.xIsNext) &&
      !calculateWinner(this.state.squares);
  }

  handleData(i) {
    console.log("received: ",i)
    if(this.myTurn()) {
      // if we get here, something's gone wrong
      console.log("opponent moved received even though it's our turn")
      return
    }
    this.doMove(i);
  }

  doMove(i) {
    const squares = this.state.squares.slice();
    if (calculateWinner(squares) || squares[i]) {
      return;
    }
    squares[i] = this.state.xIsNext ? 'X' : 'O';
    this.state.conn.send(i)
    this.setState({
      squares: squares,
      xIsNext: !this.state.xIsNext
    });    
  }

  receiveConnection(c) {
    console.log("received connection")
    c.on('data', (data) => {
      this.handleData(data)
    });
    this.setState({
      isX: true,
      conn: c,
    })
  }
  
  connectToID(id) {
    const c = this.state.peer.connect(id);
    c.on("error", (err) => {
      console.log(err)
    });
    c.on("open", () => {
      console.log("sent connection successful")
    });
    c.on('data', (data) => {
      this.handleData(data)
    });
    this.setState({
      isX: false,
      conn: c,
      friendID: id,
    })
  }

  render() {
    const winner = calculateWinner(this.state.squares);
    let status;
    if (this.state.conn == null) {
      status = 'Waiting for game to begin'
    } else if (winner) {
      status = 'You ' + ((winner == 'X') == this.state.isX ? 'won!' : 'lost!')
    } else if (this.state.squares.every(val => val != null)) {
      status = 'Game over: no winner!'
    } else {
      status = this.myTurn() ? 'Your move' : 'Waiting for opponent';
    }
    const myTurn = this.myTurn()

    return (
      <div>
        <ConnectionPanel myID={this.state.myID}
                         connectToID={this.connectToID} />
        <div className="status">{status}</div>
        <Board squares={this.state.squares}
               handleClick={this.handleClick}
               myTurn={myTurn} />
        <FontAwesomeIcon icon={solid('chess-pawn')} />
        <FontAwesomeIcon icon={solid('chess-king')} />
        <FontAwesomeIcon icon={solid('chess-queen')} />
        <FontAwesomeIcon icon={solid('chess-rook')} />
        <FontAwesomeIcon icon={solid('chess-bishop')} />
        <FontAwesomeIcon icon={solid('chess-knight')} />
      </div>
    );
  }
}

// ========================================

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<UI />);

function calculateWinner(squares) {
  const lines = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6],
  ];
  for (let i = 0; i < lines.length; i++) {
    const [a, b, c] = lines[i];
    if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
      return squares[a];
    }
  }
  return null;
}