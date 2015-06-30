// @jsx React.DOM

var {
  Link,
  Navigation,
  State,
  RouteHandler
} = ReactRouter;

var {
  LeftNav,
  MenuItem
} = mui;

const ThemeManager = new mui.Styles.ThemeManager();

// true if we should show an error dialog when there is a connection error.
// Exists so that we don't show a connection error dialog when the app is just
// starting and hasn't had a chance to connect yet.
var ShowConnectionIssues = new ReactiveVar(false);

var CONNECTION_ISSUE_TIMEOUT = 5000;

injectTapEventPlugin();

// Only show the connection error box if it has been 5 seconds since
// the app started
setTimeout(function () {
  // Show the connection error box
  ShowConnectionIssues.set(true);
}, CONNECTION_ISSUE_TIMEOUT);

AppBody = React.createClass({
  mixins: [ReactMeteorData, Navigation, State],
  propTypes: {
    handles: React.PropTypes.array.isRequired,
  },
  getInitialState() {
    return {
      menuOpen: false
    };
  },
  childContextTypes: {
    toggleMenuOpen: React.PropTypes.func.isRequired,
    muiTheme: React.PropTypes.object
  },
  getChildContext() {
    return {
      toggleMenuOpen: this.toggleMenuOpen,
      muiTheme: ThemeManager.getCurrentTheme()
    }
  },
  getMeteorData() {
    var subsReady = _.all(this.props.handles, function (handle) {
      return handle.ready();
    });

    return {
      subsReady: subsReady,
      lists: Lists.find().fetch(),
      currentUser: Meteor.user(),
      disconnected: ShowConnectionIssues.get() && (! Meteor.status().connected)
    };
  },
  toggleMenuOpen() {
    console.log("hello");
    this.setState({
      menuOpen: ! this.state.menuOpen
    });
  },
  addList() {
    var list = {
      name: Lists.defaultName(),
      incompleteCount: 0
    };

    var listId = Lists.insert(list);

    this.transitionTo('todoList', { listId: listId });
  },
  getListId() {
    return this.getParams().listId;
  },
  transitionToList(_, __, menuItem) {
    this.transitionTo(menuItem.route, menuItem.params);
  },
  render() {
    var self = this;

    let selectedIndex = 0;
    const listMenuItems = self.data.lists.map((list, index) => {
      if (self.getListId() === list._id) {
        selectedIndex = index;
      }

      return {
        text: `${list.name} (${list.incompleteCount})`,
        params: { listId: list._id },
        route: "todoList"
      }
    })

    const menuItems = [{
      text: "New List"
    }].concat(listMenuItems);

    return <div id="container">
      <LeftNav
        menuItems={menuItems}
        header={<UserSidebarSection user={ self.data.currentUser } />}
        selectedIndex={selectedIndex}
        onChange={this.transitionToList}/>
      { self.data.disconnected ? <ConnectionIssueDialog /> : "" }
      { self.data.subsReady ?
        <RouteHandler /> :
        <AppLoading /> }
    </div>
  }
});
