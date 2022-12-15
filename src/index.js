import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import { Peer } from "peerjs";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { solid, regular, brands, icon } from '@fortawesome/fontawesome-svg-core/import.macro'

function Square(props) {
  return (
    <button className="border w-12 h-12" onClick={props.onClick} disabled={!props.myTurn}>
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
      <div className="flex flex-col">
        <div className="flex-row h-12">
          {this.renderSquare(0)}
          {this.renderSquare(1)}
          {this.renderSquare(2)}
        </div>
        <div className="flex-row h-12">
          {this.renderSquare(3)}
          {this.renderSquare(4)}
          {this.renderSquare(5)}
        </div>
        <div className="flex-row h-12">
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
      'K':   <FontAwesomeIcon icon={solid('chess-king')} />,
      'Q':  <FontAwesomeIcon icon={solid('chess-queen')} />,
      'R':   <FontAwesomeIcon icon={solid('chess-rook')} />,
      'B': <FontAwesomeIcon icon={solid('chess-bishop')} />,
      'N': <FontAwesomeIcon icon={solid('chess-knight')} />,
      'P':   <FontAwesomeIcon icon={solid('chess-pawn')} />,
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
      <button className={classes} onClick={() => this.props.onClick(this.props.i,this.props.j)}>
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
      squares.unshift(<ChessSquare key={j}
                                   i={this.props.i}
                                   j={j}
                                   piece={square}
                                   onClick={this.props.onClick} />);
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
      rows.push(<ChessRow key={i} row={row} i={i} onClick={this.props.onClick}/> );
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
    this.handleChange = this.handleChange.bind(this);
    this.handleKey = this.handleKey.bind(this);
    this.state = {
      peer: null,
      myID: null,
      friendID: null,
      isX: null,
      conn: null,
      squares: Array(9).fill(null),
      xIsNext: true,
      show: false,
      host: false,
      board: chessBoard,
      fieldValue: "",
      src: null
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
  
  handleClick(i,j) {
    if(!this.state.src) {
      this.setState({
        src: [i,j]
      })
    } else {
      this.setState({
        src: null,
        board: execMove(this.state.src,[i,j],this.state.board)
      })
    }
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

  doMove(an) {
    const i1 = parseInt(an.charAt(0),10)
    const j1 = parseInt(an.charAt(1),10)
    const i2 = parseInt(an.charAt(2),10)
    const j2 = parseInt(an.charAt(3),10)
    const newBoard = execMove([i1,j1],[i2,j2],this.state.board)
    console.log(newBoard)
    /*
    this.setState({
      board: newBoard
    })
*/
    //console.log(getAllPlayerPieces('white',this.state.board))
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
  
  handleChange(event) {
    this.setState({fieldValue: event.target.value});
  }

  handleKey(event) {
    if(event.key === 'Enter') {
      this.doMove(this.state.fieldValue);
      this.setState({
        fieldValue: ""
      })
    }
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
      <div className="w-96 mx-auto text-center">
        <ChessBoard board={this.state.board} onClick={this.handleClick} />
        <input className="border w-96 p-2 text-center"
               value={this.state.fieldValue}
               onChange={this.handleChange}
               onKeyPress={this.handleKey}/>
      </div>
    );
  }
}

const backRow = ['R','N','B','Q','K','B','N','R']
const pawns = Array(8).fill('P')
const empty = Array(8).fill({})
const chessBoard = [
  backRow.map(name => { return {name:name,color:'white'} }),
  pawns.map(name => { return {name:name,color:'white'} }),
  empty.slice(),
  empty.slice(),
  empty.slice(),
  empty.slice(),
  pawns.map(name => { return {name:name,color:'black'} }),
  backRow.map(name => { return {name:name,color:'black'} }),
]

// returns indices of all pieces that can move to given loc.
function onePieceCanMove(piece,player,target,board) {

}

function pieceAtTarget(player,target,board) {
  const indices = anToIndices(target)
  console.log(indices)
  const i = indices[0]
  const j = indices[1]
  return board[i][j] && board[i][j].color == player
}

/*
function getAttackRay(src,board) {
  const attacker = board[src[0]][src[1]]
  const m = {
    'P': () => if(attacker.color == 'white') {
      return [ [src[0]-1,src[1]+1] , [src[0]
}

function isAttacking(src,target,board) {
  const attacker = board[src[0]][src[1]].piece
  const m = {
    'P': (s,d) => {}
    'N': (s,d) => { 
    'B'
    'R'
    'Q'
    'K'
  if(attacker == 'P') {
  }
}
*/


function getAllPieces(board) {
  const match = (square) => {
    return square != null
  }
  return getMatchingPieces(match,board)
}

function getAllPlayerPieces(player,board) {
  const match = (square) => {
    return square.color == player
  }
  return getMatchingPieces(match,board)
}

function getPlayerPieces(player,piece,board) {
  const match = (square) => {
    return square.color = player && square.piece == piece
  }
  return getMatchingPieces(match,board)
}

function getMatchingPieces(match,board) {
  return board.reduce((acc,row,i) => {
    const js = row.reduce((acc,square,j) => {
      return match(square) ? acc.concat([j]) : acc
    },[])
    const coords = js.map((j) => { return [i,j] })
    return acc.concat(coords)
  },[])     
}

function inCheck(player,board) {
  /*
  const kingLoc = getPlayerPieces(player,'K',board)[0]
  const enemyPieces = getAllPlayerPieces(enemy(player),board)
  for(loc in enemyPieces) {
    if isAttacking(loc,kingLoc,board) {
      return true
    }
  }
  return false// check if any pieces are attacking king
  */
}

function execMove(src,dst,board) {
  let newBoard = board.slice();
  console.log(src,dst)
  newBoard[dst[0]][dst[1]] = {
    name: board[src[0]][src[1]].name,
    color: board[src[0]][src[1]].color
  }
  newBoard[src[0]][src[1]] = {};
  return newBoard;
}

function anToIndices(an) {
  const file = an.charAt(0)
  const rank = an.charAt(1)
  const i = rank-1
  const j = file.charCodeAt(0)-97
  return [i,j]
}

function enemy(player) {
  const m = {
    'white': 'black',
    'black': 'white'
  }
  return m[player]
}

function validateMove(an,player,board) {
  let piece;
  if (an.indexOf('x') > 0) {
    piece = an.substring(0,an.length-3)
  } else {
    piece = an.substring(0,an.length-2)
  }
  const target = an.substring(an.length-2)
  const isCapture = an.charAt(an.length-3) == 'x'
  const pieces = onePieceCanMove(piece,player,target,board)
  const matchesCapture = pieceAtTarget(enemy(player),target,board) == isCapture
  const avoidsCheck = inCheck(player,execMove(pieces[0],anToIndices(target),board))
  // it's valid if there's exactly one piece that can move to the
  // destination and, if a capture is listed, if there's an enemy
  // piece at that location, and if you don't enter check
  return pieces.length ==  1 && matchesCapture && avoidsCheck
}

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