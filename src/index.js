import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import { Peer } from "peerjs";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { solid, regular, brands, icon } from '@fortawesome/fontawesome-svg-core/import.macro'

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
    if(this.props.piece.color) {
      classes = classes.concat(' ',this.colorToStyle(this.props.piece.color));
    }

    return (
      <button className={classes} onClick={() => this.props.onClick(this.props.i,this.props.j)}>
        {this.renderPiece(this.props.piece.name)}
      </button>
    );
  }
}

class ChessBoard extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    const rows = [];
    this.props.board.forEach((row,i) => {
      const squares = []
      row.forEach((square,j) => {
        squares.unshift(<ChessSquare key={-(j+1)}
                                     i={i}
                                     j={j}
                                     piece={square}
                                     onClick={this.props.onClick} /> );
      });
      rows.push(<div key={i} className="board-row">{squares}</div>)
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
      conn: null,
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
    return true /*(this.state.isX == this.state.xIsNext) &&
      !calculateWinner(this.state.squares);*/
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
    /*
    const i1 = parseInt(an.charAt(0),10)
    const j1 = parseInt(an.charAt(1),10)
    const i2 = parseInt(an.charAt(2),10)
    const j2 = parseInt(an.charAt(3),10)
    const newBoard = execMove([i1,j1],[i2,j2],this.state.board)
    console.log(newBoard)
    this.setState({
      board: newBoard
    })
    */
    console.log(validateMove(an,'white',this.state.board))
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
    const winner = false //calculateWinner(this.state.squares);
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
    /*const board = this.state.show ? <TicTacToeBoard squares={this.state.squares}
                                                    handleClick={this.handleClick}
                                                    myTurn={myTurn} /> : null;*/
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

const ranks = ['1','2','3','4','5','6','7','8']
const rankToIndex = (rank) => { return ranks.indexOf(rank) }
const files = ['a','b','c','d','e','f','g','h']
const fileToIndex = (file) => { return files.indexOf(file) }

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
// input "piece" is everything before x and target in AN
function getAllControllers(name,player,target,board) {
  const t = getPlayerPieces(player,name,board)
  console.log(name,player,target,t)
  return t.flatMap((loc) => {
    return isAttacking(loc,target,board) ? [loc] : []
  })
}

function getControllers(piece,player,target,board) {
  let name;
  let rest;
  if(backRow.includes(piece.charAt(0))) {
    name = piece.charAt(0)
    rest = piece.substring(1)
  } else {
    name = 'P'
    rest = piece
  }
  const all = getAllControllers(name,player,target,board)
  console.log(all)
  const match = (loc) => {
    if(rest.length == 2) {
      return loc[0] == rankToIndex(rest.charAt(1)) &&
        loc[1] == fileToIndex(rest.charAt(0));
    } else if(rest.length == 1) {
          console.log("rest: ",rest)

      if(files.includes(rest.charAt(0))) {
        return loc[1] == fileToIndex(rest.charAt(0))
      } else {
        return loc[0] == rankToIndex(rest.charAt(0))
      }
    } else {
      return true
    }
  }
  return all.filter(match)
}
                          
function pieceAtTarget(player,target,board) {
  const i = target[0]
  const j = target[1]
  return board[i][j] && board[i][j].color == player
}

const bishopVectors = [ [-1,-1] , [-1,1] , [1,-1] , [1,1] ]
const rookVectors = [ [-1,0] , [0,-1] , [0,1] , [1,0] ]
const kingVectors = rookVectors.concat(bishopVectors)
const queenVectors = kingVectors.slice()
const pieceToVectors = {
  'R': rookVectors,
  'Q': queenVectors,
  'B': bishopVectors,
}

function onBoard(square) {
  const i = square[0]
  const j = square[1]
  return 0 <= i && i <= 7 && 0 <= j && j <= 7
}

// doesn't yet take en passant into account. We need to add more pawn
// logic: it moves forward under certain circumstances, diagnoal in
// others. This function uses cartesian representation
// (x,y). Everywhere else uses (i,j)
function getMoves(src,board) {
  console.log("getMoves src: ",src)
  const x = src[1]
  const y = src[0]
  const attacker = board[y][x]
  let coords = []
  if(attacker.name == 'P') {
    if(attacker.color == 'white') {
      coords = [ [x-1,y+1] , [x+1,y+1] ]
    } else {
      coords = [ [x-1,y-1] , [x+1,y-1] ]
    }
  } else if(attacker.name == 'N') {
    coords = [ [x+1,y+2] , [x+2,y+1],
               [x+1,y-2] , [x+2,y-1],
               [x-1,y+2] , [x-2,y+1],
               [x-1,y-2] , [x-2,y-1] ]
  } else if(attacker.name == 'K') {
    coords = kingVectors.flatMap((v) => {
      let ray = [x,y]
      ray = [ray[0]+v[0],ray[1]+v[1]]
      if(onBoard([ray[1],ray[0]])) {
        if(board[ray[1]][ray[0]]) {
          return board[ray[1]][ray[0]].color != attacker.color ? [ray] : []
        } 
        return [ray]
      }
      return []
    })
  } else {
    console.log(x,y)
    console.log(attacker)
    console.log(pieceToVectors[attacker.name])
    coords = pieceToVectors[attacker.name].flatMap((v) => {
      let ray = [x,y]
      ray = [ray[0]+v[0],ray[1]+v[1]]
      let moves = []
      while(onBoard([ray[1],ray[0]])) {
        if(board[ray[1]][ray[0]].color) {
          if(board[ray[1]][ray[0]].color == attacker.color) {
            break
          } else {
            moves.push(ray)
            break
          }
        }
        moves.push(ray)
        ray = [ray[0]+v[0],ray[1]+v[1]]
      }
      console.log("vector: ",v,"moves: ",moves)
      return moves
    })
  }
  console.log("coords: ",coords)
  return coords.map((v) => { return [v[1],v[0]] }).filter(onBoard)
}

// doesn't take en passant into account
function isAttacking(src,target,board) {
  const ray = getMoves(src,board)
  return ray.findIndex((l) => { return l[0] == target[0] && l[1] == target[1] }) > -1
}

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
    return square.color == player && square.name == piece
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
  const kingLoc = getPlayerPieces(player,'K',board)[0]
  const enemyPieces = getAllPlayerPieces(enemy(player),board)
  console.log("enemyPieces: ",enemyPieces)
  enemyPieces.forEach((loc) => {
    console.log("inCheck loc: ",loc)
    if(isAttacking(loc,kingLoc,board)) {
      return true
    }
  })
  return false
}

function execMove(src,dst,board) {
  let newBoard = board.slice();
  console.log("execMove: ",src,dst)
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
  const j = file.charCodeAt(0) - 'a'.charCodeAt(0)
  return [i,j]
}

function enemy(player) {
  const m = {
    'white': 'black',
    'black': 'white'
  }
  return m[player]
}

// We currently have 3 coordinate representations of the board:
// indices, cartesian coordinates, and algebraic corrdinates. This is
// bad. I try to only use algebraic here, and only use cartesian in
// getMoves.
function validateMove(an,player,board) {
  let piece;
  if (an.indexOf('x') > 0) {
    piece = an.substring(0,an.length-3)
  } else {
    piece = an.substring(0,an.length-2)
  }

  const target = anToIndices(an.substring(an.length-2))
  console.log("target0: ",target)
  const isCapture = an.charAt(an.length-3) == 'x'
  const pieces = getControllers(piece,player,target,board)
  const matchesCapture = pieceAtTarget(enemy(player),target,board) == isCapture
  // it's valid if there's exactly one piece that can move to the
  // destination and, if a capture is listed, if there's an enemy
  // piece at that location, and if you don't enter check
  console.log("pieces: ",pieces)
  console.log("target1: ",target)
  if(pieces.length == 1 && matchesCapture) {
    return !inCheck(player,execMove(pieces[0],target,board))
  }
  return false
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<UI />);