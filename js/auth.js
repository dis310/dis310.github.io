(function () {
  const DEFAULT_USER = {
    username: "dis310",
    password: "123456",
  };

  const OPEN_USERS = [
    { username: "dis310", password: "123456" },
    { username: "hi0", password: "0000" },
    { username: "hi1", password: "1111" },
    { username: "hi2", password: "2222" },
    { username: "hi3", password: "3333" },
  ];

  function getAuthState() {
    return window.NexaStorage.loadJSON(window.NexaStorage.keys.user, {
      loggedIn: false,
      username: DEFAULT_USER.username,
    });
  }

  function isValidCredentials(username, password) {
    return OPEN_USERS.some((user) => user.username === username && user.password === password);
  }

  function signIn(username) {
    window.NexaStorage.saveJSON(window.NexaStorage.keys.user, {
      loggedIn: true,
      username,
    });
  }

  function signOut() {
    window.NexaStorage.saveJSON(window.NexaStorage.keys.user, {
      loggedIn: false,
      username: DEFAULT_USER.username,
    });
  }

  window.NexaAuth = {
    getAuthState,
    isValidCredentials,
    getOpenUsers: () => OPEN_USERS.slice(),
    signIn,
    signOut,
  };
})();
