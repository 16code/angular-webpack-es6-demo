class HomeController {
    constructor($q, MoviesApi) {
        'ngInject';
        Object.assign(this, {$q, MoviesApi});
        this.activate();
    }
    activate() {
        this.getPopularMovies();
    }
    getPopularMovies() {
        const popularMoviesPromise = this.MoviesApi.$popular();
        popularMoviesPromise.then((resp) => {
            this.popularMovies = resp.results.slice(0, 8);
            this.upComingMovies = resp.results.slice(8, 16);
            this.topRatedMovies = resp.results.slice(16);
        }, (err) => {
            console.log(err);
        });
    }
}

export default HomeController;
