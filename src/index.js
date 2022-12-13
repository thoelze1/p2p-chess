import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import { Peer } from "peerjs";

function Square(props) {
  return (
    <button className="square" onClick={props.onClick}>
      {props.value}
    </button>
  );
}

class Board extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      squares: Array(9).fill(null),
      xIsNext: true,
    };
  }

  handleClick(i) {
    const squares = this.state.squares.slice();
    if (calculateWinner(squares) || squares[i]) {
      return;
    }
    squares[i] = this.state.xIsNext ? 'X' : 'O';
    this.setState({
      squares: squares,
      xIsNext: !this.state.xIsNext
    });
  }

  renderSquare(i) {
    return <Square value={this.state.squares[i]}
                   onClick={() => this.handleClick(i)}
           />;
  }

  render() {
    const winner = calculateWinner(this.state.squares);
    let status;
    if (winner) {
      status = 'Winner: ' + winner;
    } else {
      status = 'Next player: ' + (this.state.xIsNext ? 'X' : 'O');
    }
        
    return (
      <div>
        <div className="status">{status}</div>
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

class UI extends React.Component {
  constructor(props) {
    super(props);
    const p = new Peer();
    p.on('open', (id) => {
      this.setState({
        myID: id,
      });
    });
    p.on('connection', (conn) => {
      console.log("received connection")
      conn.on('data', (data) => {
        console.log(data);
      });
    });
    this.state = {
      peer: p,
      myID: null,
      friendID: "",
    };
    // see https://reactjs.org/docs/forms.html
    this.handleChange = this.handleChange.bind(this);
    this.connectToID = this.connectToID.bind(this);
  }

  connectToID(event) {
    // prevents page refresh
    event.preventDefault()
    const conn = this.state.peer.connect(this.state.friendID);
    conn.on("error", (err) => {
      console.log(err)
    });
    conn.on("open", () => {
      conn.send("hi!");
      console.log("sent connection successful")
    });
  }

  handleChange(event) {
    this.setState({friendID: event.target.value});
    console.log(this.state.friendID);
  }

  render() {
    return (
      <div>
        <div>
          <span>
            Your peer ID: {this.state.myID ? this.state.myID : "waiting"}
          </span>
          <form onSubmit={this.connectToID}>
            <label>
              Connect to ID:
              <textarea value={this.state.friendID} onChange={this.handleChange}/>
            </label>
            <input type="submit" value="Submit" />
          </form>
        </div>
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