/* jshint esnext: true */

const pieceImagePath = 'images/chesspieces/wikipedia/{piece}.png';

function BoardHelper(options) {
  options = options || {};
  const helper = this;
  this.onMove = options.onMove;
  this.board = ChessBoard(options.domID || 'chessboard', {
    pieceTheme: pieceImagePath,
    position: this.parseBoardState(startingBoardState),
    draggable: true,
    this.onDrop.bind(this),
  });
}

BoardHelper.prototype = {
  onDrop(moveStart, moveEnd) {
    const move = [moveStart, moveEnd].join('-');
    if(moveStart === moveEnd) {
      return 'snapback';
    }
    if(this.onMove) {
      this.onMove(move);
    }
  },
  update(boardState, animate) {
    this.board.position(this.parseBoardState(boardState), animate);
  },
  parseBoardState(boardState) {
    return boardState.split(',').reduce(function(pieces, data) {
      var split = data.split(':');
      pieces[split[0]] = split[1];
      return pieces;
    }, {});
  },
  flip() {
    this.board.flip();
  },
};

// window.BoardHelper = BoardHelper;
export default BoardHelper
