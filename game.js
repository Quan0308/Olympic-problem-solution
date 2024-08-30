const matchResults = {};
function simulateGroupStage(groups) {
  const groupResults = {};
  const allTeams = []; // Store match results for checking head-to-head encounters

  // Simulate each group
  console.log(`Group Stage - Round I:\n`);
  for (const groupName in groups) {
    const groupResult = simulateGroup(groups[groupName], groupName, matchResults);
    groupResults[groupName] = groupResult;
    allTeams.push(...groupResult);
    console.log("\n");
  }

  console.log("Final Group Standings:");
  for (const groupName in groupResults) {
    printFinalStandings(groupResults[groupName], groupName);
  }

  // Consolidate all teams from all groups and rank them
  const sortedTeams = rankTeams(allTeams, matchResults);

  console.log("\nTeams advancing to the knockout stage:");
  const advancingTeams = sortedTeams.slice(0, 8);
  advancingTeams.forEach((team, index) => {
    console.log(`${index + 1}. ${team.Team}`);
  });

  console.log("\nTeam not continuing in the competition:");
  console.log(`${sortedTeams[8].Team}`);

  return advancingTeams;
}

function simulateGroup(group, groupName, matchResults) {
  const results = {};
  group = group.map(team => ({
    ...team,
    points: 0,
    wins: 0,
    losses: 0,
    draws: 0,
    headToHead: {},
    pointDiff: 0
  }));

  console.log(`Group ${groupName}:`);
  for (let i = 0; i < group.length; i++) {
    for (let j = i + 1; j < group.length; j++) {
      const firstTeam = group[i];
      const secondTeam = group[j];

      const key = `${firstTeam.Team} vs ${secondTeam.Team}`;
      const result = simulateMatch(firstTeam, secondTeam);
      results[key] = result;
      matchResults[key] = result; // Store the match result for head-to-head check

      // Update points and head-to-head results based on match result
      if (result.winner === firstTeam) {
        firstTeam.points += 3; // Win gives 3 points
        firstTeam.wins += 1;
        secondTeam.losses += 1;
        firstTeam.headToHead[secondTeam.Team] = { pointsFor: result.score1, pointsAgainst: result.score2 };
        secondTeam.headToHead[firstTeam.Team] = { pointsFor: result.score2, pointsAgainst: result.score1 };
      } else if (result.winner === secondTeam) {
        secondTeam.points += 3; // Win gives 3 points
        secondTeam.wins += 1;
        firstTeam.losses += 1;
        secondTeam.headToHead[firstTeam.Team] = { pointsFor: result.score2, pointsAgainst: result.score1 };
        firstTeam.headToHead[secondTeam.Team] = { pointsFor: result.score1, pointsAgainst: result.score2 };
      } else {
        firstTeam.points += 1; // Draw gives 1 point each
        secondTeam.points += 1;
        firstTeam.draws += 1;
        secondTeam.draws += 1;
        firstTeam.headToHead[secondTeam.Team] = { pointsFor: result.score1, pointsAgainst: result.score2 };
        secondTeam.headToHead[firstTeam.Team] = { pointsFor: result.score2, pointsAgainst: result.score1 };
      }

      console.log(`${firstTeam.Team} - ${secondTeam.Team} (${result.score1}:${result.score2})`);
    }
  }

  return group;
}

function simulateMatch(firstTeam, secondTeam) {
  const score1 = firstTeam.FIBARanking;
  const score2 = secondTeam.FIBARanking;
  let winner, loser;

  if (score1 > score2) {
    winner = firstTeam;
    loser = secondTeam;
  } else if (score1 < score2) {
    winner = secondTeam;
    loser = firstTeam;
  } else {
    winner = loser = null; // draw
  }

  return { winner, loser, score1, score2 };
}

function rankTeams(teams, matchResults) {
  // Sort teams based on points, then head-to-head results, then point difference
  return teams.sort((a, b) => {
    if (a.points !== b.points) return b.points - a.points;

    // Handle tie-breaking by head-to-head results
    if (a.headToHead[b.Team] && b.headToHead[a.Team]) {
      return b.headToHead[b.Team].pointsFor - a.headToHead[a.Team].pointsFor;
    }
    
    // If still tied, use point difference in head-to-head matches
    const aPointDiff = a.headToHead[b.Team] ? a.headToHead[b.Team].pointsFor - a.headToHead[b.Team].pointsAgainst : 0;
    const bPointDiff = b.headToHead[a.Team] ? b.headToHead[a.Team].pointsFor - b.headToHead[a.Team].pointsAgainst : 0;
    return bPointDiff - aPointDiff;
  });
}

function printFinalStandings(group, groupName) {
  console.log(`\nFinal Standings for Group ${groupName} (Name - Wins/Losses/Points):`);
  group.forEach((team, index) => {
    console.log(`${index + 1}. ${team.Team} ${team.wins} / ${team.losses} / ${team.points}`);
  });
}

function drawStage(advancingTeams) {
  // Divide teams into pots
  const pots = {
    D: advancingTeams.slice(0, 2),
    E: advancingTeams.slice(2, 4),
    F: advancingTeams.slice(4, 6),
    G: advancingTeams.slice(6, 8)
  };

  console.log("\nPots:");
  for (const [potName, teams] of Object.entries(pots)) {
    console.log(`${potName}: ${teams.map(team => team.Team).join(" ")}`);
  }

  // Form quarter-final pairs
  const quarterFinalPairs = [];
  const semiFinalPairs = [];
  const quarterFinals = [
    { pot1: pots.D, pot2: pots.G },
    { pot1: pots.E, pot2: pots.F }
  ];

  for (const match of quarterFinals) {
    const pair1 = drawMatchPair(match.pot1, match.pot2);
    const pair2 = [match.pot1.filter(team => team !== pair1[0])[0], match.pot2.filter(team => team !== pair1[1])[0]];
    quarterFinalPairs.push(pair1, pair2);
  }

  // Form semi-final pairs
  for(const match of quarterFinalPairs) {
    const pair1 = drawMatchPair([match[0]], [match[1]]);
    semiFinalPairs.push(pair1);
  }

  console.log("\nKnockout Stage:");
  quarterFinalPairs.forEach(pair => {
    console.log(`${pair[0].Team} - ${pair[1].Team}`);
  });

  console.log("\nSemi-Final Structure:");
  semiFinalPairs.forEach((pair, index) => {
    console.log(`Semi-Final ${index + 1}: Winner of ${pair[0].Team} vs Winner of ${pair[1].Team}`);
  });

  return { quarterFinalPairs, semiFinalPairs };
}

function drawMatchPair(pot1, pot2) {
  let matchPair;

  do {
    const team1 = pot1.splice(Math.floor(Math.random() * pot1.length), 1)[0];
    const team2 = pot2.splice(Math.floor(Math.random() * pot2.length), 1)[0];

    if (!haveMetInGroupStage(team1, team2)) {
      matchPair = [team1, team2];
    } else {
      pot1.push(team1); // Put the team back in the pot
      pot2.push(team2); // Put the team back in the pot
    }
  } while (!matchPair);

  return matchPair;
}

function haveMetInGroupStage(team1, team2) {
  const key = `${team1.Team} vs ${team2.Team}`;
  return matchResults[key] || matchResults[`${team2.Team} vs ${team1.Team}`];
}

function knockoutStage(quarterFinalPairs) {
  // Simulate quarter-finals
  console.log("\nQuarter-Finals:");
  const quarterFinalWinners = [];
  for (const [team1, team2] of quarterFinalPairs) {
    const { winner, score1, score2 } = simulateKnockoutMatch(team1, team2);
    console.log(`${team1.Team} - ${team2.Team} (${score1}:${score2})`);
    quarterFinalWinners.push(winner);
  }

  // Form semi-final pairs
  const semiFinalPairs = [];
  semiFinalPairs.push([quarterFinalWinners[0], quarterFinalWinners[2]]);
  semiFinalPairs.push([quarterFinalWinners[1], quarterFinalWinners[3]]);

  console.log("\nSemi-Final Structure:");
  semiFinalPairs.forEach((pair, index) => {
    console.log(`Semi-Final ${index + 1}: Winner of ${pair[0].Team} vs Winner of ${pair[1].Team}`);
  });

  // Simulate semi-finals
  console.log("\nSemi-Finals:");
  const semiFinalWinners = [];
  const semiFinalLosers = [];
  for (const [team1, team2] of semiFinalPairs) {
    const { winner, loser, score1, score2 } = simulateKnockoutMatch(team1, team2);
    console.log(`${team1.Team} - ${team2.Team} (${score1}:${score2})`);
    semiFinalWinners.push(winner);
    semiFinalLosers.push(loser);
  }

  // Simulate third-place match
  console.log("\nThird-Place Match:");
  const { winner: thirdPlaceWinner, score1: thirdPlaceScore1, score2: thirdPlaceScore2 } = simulateKnockoutMatch(semiFinalLosers[0], semiFinalLosers[1]);
  console.log(`${semiFinalLosers[0].Team} - ${semiFinalLosers[1].Team} (${thirdPlaceScore1}:${thirdPlaceScore2})`);

  // Simulate final
  console.log("\nFinal:");
  const { winner: champion, score1: finalScore1, score2: finalScore2 } = simulateKnockoutMatch(semiFinalWinners[0], semiFinalWinners[1]);
  console.log(`${semiFinalWinners[0].Team} - ${semiFinalWinners[1].Team} (${finalScore1}:${finalScore2})`);

  // Display medal winners
  console.log("\nMedals:");
  console.log(`Gold: ${champion.Team}`);
  console.log(`Silver: ${semiFinalWinners[1].Team}`);
  console.log(`Bronze: ${thirdPlaceWinner.Team}`);
}

function simulateKnockoutMatch(team1, team2) {
  const score1 = team1.FIBARanking;
  const score2 = team2.FIBARanking;
  let winner, loser;

  if (score1 > score2) {
    winner = team1;
    loser = team2;
  } else {
    winner = team2;
    loser = team1;
  }

  return { winner, loser, score1, score2 };
}

function Main() {
  const groups = require("./groups.json");

  // Step 1: Simulate Group Stage
  const advancingTeams = simulateGroupStage(groups);

  // Step 2: Conduct Draw for Knockout Stage
  const { quarterFinalPairs, semiFinalPairs } = drawStage(advancingTeams);

  // Step 3: Simulate Knockout Stage
  knockoutStage(quarterFinalPairs, semiFinalPairs);
}

Main();
