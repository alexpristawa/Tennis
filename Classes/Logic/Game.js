class Game extends Logic{

    static scoreArr = [0, 15, 30, 40, 45, 50];

    constructor(parent) {
        super();
        this.match = Match.match;
        this.parent = parent;
        Match.game = this;

        this.serving = 0;


        this.serving = this.serving == 0 ? 1:0;
        Logic.exclamationMessage = 'New Game!';
        this.match.score[0].points = 0;
        this.match.score[1].points = 0;

        (this.match.score[0].points +this.match.score[1].points)%2 == 0 ? this.servingSide = 'deuce' : this.servingSide = 'advantage';

        new Point(this);
    }

    pointEnded(winner) {
        this.match.score[winner].points++;
        Stat.updateStats("point", {difficulty: this.match.difficulty, won: winner == 0});
        StorageManager.resetRecord("point");
        if(this.match.score[winner].points == 5) {
            this.parent.gameEnded(winner);
            return;
        } else if(this.match.score[winner].points == 4) {
            if(this.match.score[Math.abs(winner-1)].points == 4) {
                this.match.score[winner].points = 3;
                this.match.score[Math.abs(winner-1)].points = 3;
            } else if(Math.abs(this.match.score[0].points-this.match.score[1].points) >= 2){
                this.parent.gameEnded(winner);
                return;
            }
        }

        new Point(this);
    }
}