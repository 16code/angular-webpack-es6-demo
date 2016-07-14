import angular from 'angular';
const [handlingStateChangeError, hasOtherwise, stateCounts] = [Symbol(), Symbol(), Symbol()];
class RouterHelper {
    constructor(config, $stateProvider, $urlRouterProvider, $rootScope, $state, LoginResolve) {
        Object.assign(this, {
            config,
            $stateProvider,
            $urlRouterProvider,
            $rootScope,
            $state,
            LoginResolve
        });
        this[handlingStateChangeError] = false;
        this[hasOtherwise] = false;
        this[stateCounts] = {
            errors: 0,
            changes: 0
        };
        this.handleRoutingErrors();
        this.updateDocTitle();
        this.handleRoutingChangeStart();
    }
    configureStates(states, otherwisePath) {
        const self = this;
        states.forEach((state) => {
            // 添加登录检查 requireLogin is true
            const data = state.config.data;
            if (data && data.requireLogin === true) {
                state.config.resolve = angular.extend(
                    state.config.resolve || {}, {
                        loginResolve: self.LoginResolve.login
                    }
                );
            }
            state.config.resolve = angular.extend(state.config.resolve || {}, self.config.resolveAlways);
            this.$stateProvider.state(state.state, state.config);
        });
        if (otherwisePath && !this[hasOtherwise]) {
            this[hasOtherwise] = true;
            this.$urlRouterProvider.otherwise(otherwisePath);
        }
    }
    handleRoutingErrors() {
        // 错误路由处理
        this.$rootScope.$on('$stateChangeError',
            (event, toState, toParams, fromState, fromParams, error) => {
                if (this[handlingStateChangeError]) {
                    return;
                }
                this[stateCounts].errors++;
                this[handlingStateChangeError] = true;
                const destination = (toState &&
                        (toState.title || toState.name || toState.loadedTemplateUrl)) ||
                    'unknown target';
                const errorMessage = (error && error.message) || error;
                const msg = `Error routing to ${destination}.\nReason: ${errorMessage}.`;
                console.warn(msg);
                // 错误路由具体处理
                switch (error) {
                    case 'requireLogin':
                        this.$state.prev = {
                            state: toState.name,
                            params: toParams
                        };
                        this.$state.go('root.layout.login');
                        break;
                    default:
                        this.$state.go('root.layout.home');
                }
            }
        );
    }
    handleRoutingChangeStart() {
        this.$rootScope.$on('$stateChangeStart', (event, toState) => {
            if (toState.redirectTo) {
                event.preventDefault();
                const redirectToUri = this.$state.href(toState.redirectTo, {}, {absolute: true});
                window.location.href = redirectToUri;
            }
        });
    }
    getStates() {
        return this.$state.get();
    }
    updateDocTitle() {
        this.$rootScope.$on('$stateChangeSuccess',
            (event, toState) => {
                this[stateCounts].changes++;
                this[handlingStateChangeError] = false;
                const title = `${toState.data.title} - ${this.config.mainTitle}`;
                const pageClass = toState.data.className || 'default';
                // 更新文档 title && class，可以利用 page class 变换不同页面表现样式
                this.$rootScope.title = title;
                this.$rootScope.pageClass = pageClass;
            }
        );
    }
}
class RouterHelperProvider {
    constructor($locationProvider, $stateProvider, $urlRouterProvider) {
        'ngInject';
        Object.assign(this, {
            $locationProvider,
            $stateProvider,
            $urlRouterProvider
        });
        this.config = {
            mainTitle: '',
            resolveAlways: {}
        };
        this.$locationProvider.html5Mode(true);
    }
    configure(cfg) {
        angular.extend(this.config, cfg);
    }
    $get($rootScope, $state, LoginResolve) {
        'ngInject';
        return new RouterHelper(
            this.config, this.$stateProvider, this.$urlRouterProvider,
            $rootScope, $state, LoginResolve);
    }
}
export default RouterHelperProvider;
