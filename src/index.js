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
  }

  renderSquare(i) {
    return <Square value={this.props.squares[i]}
                   onClick={() => this.props.handleClick(i)}
           />;
  }

  render() {
    const winner = calculateWinner(this.props.squares);
    let status;
    if (winner) {
      status = 'Winner: ' + winner;
    } else {
      status = 'Next player: ' + (this.props.xIsNext ? 'X' : 'O');
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
    p.on('connection', (c) => {
      this.setState({
        isX: true,
      })
      console.log("received connection")
      c.on('data', (data) => {
        this.handleData(data)
      });
      this.setState({
        conn: c,
      })
    });
    this.state = {
      peer: p,
      myID: null,
      friendID: "",
      isX: null,
      conn: null,
      squares: Array(9).fill(null),
      xIsNext: true,
    };
    // see https://reactjs.org/docs/forms.html
    this.handleChange = this.handleChange.bind(this);
    this.connectToID = this.connectToID.bind(this);
    this.handleClick = this.handleClick.bind(this);
  }

  handleClick(i) {
    if(this.state.isX != this.state.xIsNext) {
      return
    }
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

  handleData(i) {
    console.log("received: ",i)
    if(this.state.isX == this.state.xIsNext) {
      // this would be a bad state...
      console.log(this.state.isX,this.state.xIsNext)
      return
    }
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
  
  connectToID(event) {
    // prevents page refresh
    event.preventDefault()
    const c = this.state.peer.connect(this.state.friendID);
    c.on("error", (err) => {
      console.log(err)
    });
    c.on("open", () => {
      //c.send("hi!");
      console.log("sent connection successful")
    });
    c.on('data', (data) => {
      this.handleData(data)
    });
    this.setState({
      isX: false,
      conn: c,
    })
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
          <Board squares={this.state.squares}
                 handleClick={this.handleClick}
                 xIsNext={this.state.xIsNext} />
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