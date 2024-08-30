function simulateGroupStage(groups) {
  const groupResults = {};
  const allTeams = [];

  // Simulate each group
  console.log(`Group Stage - Round I:\n`);
  for (const groupName in groups) {
    const groupResult = simulateGroup(groups[groupName], groupName);
    groupResults[groupName] = groupResult;
    allTeams.push(...groupResult);
    console.log("\n");
  }

  console.log("Final Group Standings:");
  for (const groupName in groupResults) {
    printFinalStandings(groupResults[groupName], groupName);
  }

  // Consolidate all teams from all groups and rank them
  const sortedTeams = rankTeams(allTeams);

  console.log("\nTeams advancing to the knockout stage:");
  const advancingTeams = sortedTeams.slice(0, 8);
  advancingTeams.forEach((team, index) => {
    console.log(`${index + 1}. ${team.Team}`);
  });

  console.log("\nTeam not continuing in the competition:");
  console.log(`${sortedTeams[8].Team}`);

  return advancingTeams;
}

function simulateGroup(group, groupName) {
  const results = {};
  group = group.map(team => ({ ...team, point: 0, pointsScored: 0, pointsAllowed: 0, pointDiff: 0, wins: 0, losses: 0, headToHead: {} }));

  console.log(`Group ${groupName}:`);
  for (let i = 0; i < group.length; i++) {
    for (let j = i + 1; j < group.length; j++) {
      const firstTeam = group[i];
      const secondTeam = group[j];

      const key = `${firstTeam.Team} vs ${secondTeam.Team}`;
      const result = simulateMatch(firstTeam, secondTeam);
      results[key] = result;
      firstTeam.pointsScored += result.score1;
      firstTeam.pointsAllowed += result.score2;
      secondTeam.pointsScored += result.score2;
      secondTeam.pointsAllowed += result.score1;
      firstTeam.pointDiff = firstTeam.pointsScored - firstTeam.pointsAllowed;
      secondTeam.pointDiff = secondTeam.pointsScored - secondTeam.pointsAllowed;

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
    winner.wins += 1;
  } else if (score1 < score2) {
    winner = secondTeam;
    loser = firstTeam;
    winner.wins += 1;
  } else {
    winner = loser = null; // draw
    firstTeam.draws += 1;
    secondTeam.draws += 1;
  }
  return { winner, score1, score2 };
}

function rankByHeadToHead(teamA, teamB) {
  const headToHeadA = teamA.headToHead[teamB.Team];
  const headToHeadB = teamB.headToHead[teamA.Team];

  if (headToHeadA && headToHeadB) {
    return headToHeadB.pointsFor - headToHeadA.pointsFor;
  }
  return 0;
}

function rankTeams(teams) {
  const firstPlace = [];
  const secondPlace = [];
  const thirdPlace = [];

  for (let i = 0; i < teams.length; i += 3) {
    firstPlace.push(teams[i]);
    secondPlace.push(teams[i + 1]);
    thirdPlace.push(teams[i + 2]);
  }

  return [
    ...rankGroupTeams(firstPlace),
    ...rankGroupTeams(secondPlace),
    ...rankGroupTeams(thirdPlace)
  ];
}

function rankGroupTeams(teams) {
  return teams.sort((a, b) => b.point - a.point || rankByHeadToHead(a, b) || (b.pointDiff - a.pointDiff));
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
    const pair2 = drawMatchPair(match.pot1, match.pot2);
    quarterFinalPairs.push(pair1, pair2);
  }

  // Form semi-final pairs
  semiFinalPairs.push([quarterFinalPairs[0], quarterFinalPairs[2]]);
  semiFinalPairs.push([quarterFinalPairs[1], quarterFinalPairs[3]]);

  console.log("\nKnockout Stage:");
  quarterFinalPairs.forEach(pair => {
    console.log(`${pair[0].Team} - ${pair[1].Team}`);
  });

  console.log("\nSemi-Final Structure:");
  semiFinalPairs.forEach((pair, index) => {
    console.log(`Semi-Final ${index + 1}: Winner of ${pair[0][0].Team} - ${pair[0][1].Team} vs Winner of ${pair[1][0].Team} - ${pair[1][1].Team}`);
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
  // Logic to check if the teams have met in the group stage
  return false; // Placeholder
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
  const score1 = team1.FIBARanking
  const score2 = team2.FIBARanking
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

function printFinalStandings(group, groupName) {
  console.log(`\nFinal Standings for Group ${groupName} (Name - Wins/Losses/Points/Points Scored/Points Allowed/Point Difference):`);
  group.forEach((team, index) => {
    console.log(`${index + 1}. ${team.Team} ${team.wins} / ${team.losses} / ${team.point} / ${team.pointsScored} / ${team.pointsAllowed} / ${team.pointDiff > 0 ? '+' : ''}${team.pointDiff}`);
  });
}

function Main() {
  const groups = require("./groups.json")

  // Step 1: Simulate Group Stage
  const advancingTeams = simulateGroupStage(groups);

  // Step 2: Conduct Draw for Knockout Stage
  const { quarterFinalPairs, semiFinalPairs } = drawStage(advancingTeams);

  // Step 3: Simulate Knockout Stage
  knockoutStage(quarterFinalPairs, semiFinalPairs);
}

Main();
