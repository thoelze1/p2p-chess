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

class TicTacToeBoard extends React.Component {
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

class ChessSquare extends React.Component {
  constructor(props) {
    super(props)
  }
  
  renderPiece(name) {
    const m = {
      'king':   <FontAwesomeIcon icon={solid('chess-king')} />,
      'queen':  <FontAwesomeIcon icon={solid('chess-queen')} />,
      'rook':   <FontAwesomeIcon icon={solid('chess-rook')} />,
      'bishop': <FontAwesomeIcon icon={solid('chess-bishop')} />,
      'knight': <FontAwesomeIcon icon={solid('chess-knight')} />,
      'pawn':   <FontAwesomeIcon icon={solid('chess-pawn')} />,
    }
    return m[name]
  }

  colorToStyle(color) {
    const m = {
      'white': 'text-white',
      'black': 'text-slate-800',
    }
    return m[color]
  }

  render() {
    let classes = (this.props.i % 2) == (this.props.j % 2) ? "chessSquare bg-gray-300" : "chessSquare bg-gray-400";
    classes = classes.concat(' ',this.colorToStyle(this.props.piece.color));

    return (
      <button className={classes}>
        {this.renderPiece(this.props.piece.name)}
      </button>
    );
  }
}

class ChessRow extends React.Component {
  constructor(props) {
    super(props)
  }

  render() {
    const squares = []
    this.props.row.forEach((square,j) => {
      squares.push(<ChessSquare key={j} i={this.props.i} j={j} piece={square} />);
    });
    return <div className="board-row">{squares}</div>
  }
}

class ChessBoard extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    const rows = [];
    this.props.board.forEach((row,i) => {
      rows.push(<ChessRow key={i} row={row} i={i}/> );
    });
    return <div>{rows}</div>;
  }
}

class ConnectionPanel extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      fieldValue: ""
    };
    this.handleChange = this.handleChange.bind(this);
    this.handleSubmitJoin = this.handleSubmitJoin.bind(this);
    this.handleSubmitNew = this.handleSubmitNew.bind(this);
    this.handleKey = this.handleKey.bind(this);
  }

  handleSubmitNew(event) {
    this.props.host();
  }
  
  handleChange(event) {
    this.setState({fieldValue: event.target.value});
  }

  handleSubmitJoin(event) {
    event.preventDefault(); // prevents page refresh
    this.props.join(this.state.fieldValue);
  }

  handleKey(event) {
    if(event.key === 'Enter') {
      this.props.join(this.state.fieldValue);
    }
  }
  
  render() {
    return (
      <div className="flex flex-col gap-2 w-96">
        <div className="flex-1">
          <button className="p-4 bg-slate-300 w-96"
                  onClick={this.handleSubmitNew}>New chess board</button>
        </div>
        <div className="flex-1">
          <button className="p-4 bg-slate-300 w-96"
                  onClick={this.handleSubmitJoin}>Join chess board</button>
          <input className="border w-96 p-2 text-center"
                 value={this.state.fieldValue}
                 onChange={this.handleChange}
                 onKeyPress={this.handleKey}/>
        </div>
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
    this.initializePeer = this.initializePeer.bind(this);
    this.hostBoard = this.hostBoard.bind(this);
    this.state = {
      peer: null,
      myID: null,
      friendID: null,
      isX: null,
      conn: null,
      squares: Array(9).fill(null),
      xIsNext: true,
      show: false,
      host: false
    };
  }

  componentDidMount() {
    this.initializePeer()
  }

  initializePeer() {
    const p = new Peer();
    p.on('open', (id) => {
      this.setState({
        myID: id,
      });
    });
    p.on('connection', this.receiveConnection);
    this.setState({
      peer: p
    });
  }

  hostBoard() {
    this.setState({
      show: true,
      host: true
    })
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
      show: true,
      isX: false,
      conn: c,
      friendID: id,
    })
  }

  render() {
    const winner = calculateWinner(this.state.squares);
    let status;
    if (!this.state.show) {
      status = null
    } else if (this.state.conn == null) {
      status = 'Waiting for an opponent to join'
    } else if (winner) {
      status = 'You ' + ((winner == 'X') == this.state.isX ? 'won!' : 'lost!')
    } else if (this.state.squares.every(val => val != null)) {
      status = 'Game over: no winner!'
    } else {
      status = this.myTurn() ? 'Your move' : 'Waiting for opponent to play...';
    }
    const myTurn = this.myTurn()
    const board = this.state.show ? <TicTacToeBoard squares={this.state.squares}
                                                    handleClick={this.handleClick}
                                                    myTurn={myTurn} /> : null;
    const id = this.state.host ? "Board ID: ".concat(this.state.myID) : null 
    return (
      <div className="w-96 text-center">
        <ConnectionPanel host={this.hostBoard}
                         join={this.connectToID} />
        <div className="p-2 text-center">
          {id}
        </div>
        <div className="status">{status}</div>
        {board}
      </div>
    );
  }
}

const backRow = ['rook','knight','bishop','queen','king','bishop','knight','rook']
const pawns = Array(8).fill('pawn')
const empty = Array(8).fill('')
const chessBoard = [
  backRow.map(name => { return {name:name,color:'black'} }),
  pawns.map(name => { return {name:name,color:'black'} }),
  empty,
  empty,
  empty,
  empty,
  pawns.map(name => { return {name:name,color:'white'} }),
  backRow.map(name => { return {name:name,color:'white'} }),
]

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