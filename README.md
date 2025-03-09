# Clicks To X

A browser game where your lobby races to get from one Wikipedia page to another in the fewest clicks.

---

This game can be played by any group that meets the following requirements:

1. A minimum of two players are needed in the lobby.
2. This lobby should have a common and fast mode of communication, eg. a discord call and/or the browser extension from this repo.
3. An agreed upon version of Wikipedia. The full English desktop version of Wikipedia is typically used.
   1. You can experiment with something different, but this may change further aspects of the game and is not supported by this repo.

## Game Mechanics

1. A time limit is imposed.
   1. Five minutes is a good default amount.
2. A destination page is picked first and communicated to the lobby. This should be a proper noun that is well recognized by your lobby members.
   1. Common nouns, unrecognized words and stub articles are not taken since they don't encourage novel paths from the source.
3. A source page is picked next. This can be picked as well, although a random page for the source is also fine. The timer starts when the source page is communicated to all lobby members.
4. Each player then privately attempts to navigate to the destination page by clicking on article links in the source page and subsequently opened pages.
   1. The links used must be a part of the article:
      1. Talk, History, Source, Tools, Disambiguation, References, Citations etc aren't considered as part of the article.
      2. Right-aligned info sections and the 'See Also' section are allowed.
5. After the timer ends, each player that managed to find the destination calculates their click count, i.e. the number of intermediary pages between the source and the destination (exclusive of source and destination) that their path took.
   1. This is a party game. Learning about the creative paths taken by others is a part of the fun!
6. The member(s) with the lowest click count wins.
   1. In case of multiple members who achieved the lowest count, if the member who reached the destination with that count first can be determined, that member wins.

## Instructions

This project contains a backend (that needs to be self-hosted) and a browser extension that should be installed for your lobby members.

### Running the backend

The backend should be hosted in a way such that it is either accessible from the public internet, or the lobby members should all be a part of the local network where the backend is running.

1. Clone this repository
2. Change directory to the `backend/` folder
3. Run `npm install`
4. Run `npm run start`

That's it. The application logs should tell you what port the backend is running on. Make a note of that along with the hostname where the backend is running.

### Using the extension

Go to the [releases page](https://github.com/EnKrypt/ClicksToX/releases) and download the latest release.

You need to load the downloaded release as an unpacked extension. This process differs based on your browser, so you may need to look up the steps to do that for the particular browser you have.

1. Create or Join a lobby
   1. If you're creating a new lobby for your group, you'll need to enter the following:
      1. The hostname and port of the server. Example: `wss://example.com:9980`.
      2. Your alias.
      3. The time limit. 5 minutes is the default.
   2. If you're joining an existing lobby, you'll need to enter the following:
      1. The hostname and port of the server. Example: `wss://example.com:9980`.
      2. Your alias.
      3. The lobby code. Example `AAAA`.
2. Once you're part of a lobby, you can see the following:
   1. The lobby code that can be used by others to join.
   2. The players who have currently joined.
   3. The game timer which will not count down until the game has started.
3. Players must now submit candidates for a destination page. Each player enters a URL to a Wikipedia article. This can be left blank.
4. The lobby creator can end submission. This causes one of the submitted destinations to be picked at random.
   1. If all submissions are blank, the page for Shia LaBeouf is selected. Yup, at least one of you'd better submit a URL. [Or else](https://www.youtube.com/watch?v=o0u4M6vppCI).
5. All members should see the picked destination page. The lobby creator can now choose to start the game.
6. The source page is then automatically selected for the lobby. If there were more than one distinct submissions for the destination page, the source page is picked from the remaining pool of submissions, otherwise a random Wikipedia page is picked as the source page. A few things will now happen:
   1. The source page auto-opens.
   1. The timer starts to count down.
7. As you make your way to the destination page, you will notice indicators for whether a player has completed a path from the source page to the destination page.
   1. Open links by clicking on them or by opening them in a new tab preferably. Do not restore closed tabs with Ctrl(or Cmd)+Shift+T and do not open links by opening them from a different page unrelated to the game or by pasting the URL.
8. The background of the UI will also change according to your progress:
   1. A black background indicates that you have not completed the path to the destination page.
   2. A green background indicates that you are currently the first to complete the path in the fewest clicks in the lobby.
   3. A blue background indicates that you have completed the path but either not in as few clicks as someone else in the lobby, or you were not the first to do so.
9. When the timer goes to zero, the game ends. At this point, the indicators update to reflect the click count of each player. You can also traverse the tree that each player took as they were navigating.
10. The lobby creator can start a new game by opening submissions for the destination page.

## Cheating

All actions and events including the timer countdown happen server-side. There is client side validation for opening links that are present in the current page.
That said, there is no server-side anti-cheat functionality implemented here, nor are such features planned.
The best anti-cheat is to play with people you know who value their time enough to not cheat in a party game.

## Context

This is a game I played with my friends back in high school. We originally called it 'Clicks to Hitler' since Hitler's Wikipedia page was the only destination page we played with. See [The Wikipedia Game](https://en.wikipedia.org/wiki/Wikipedia:Wiki_Game#Variations). \
We started playing it again and it seemed like a fun project to build some automated tooling for it.

You may have noticed some streamers or internet celebrities play this, but just to set the record straight, this game existed long before. If you're here to play the same game, feel free to use the resources available here.
