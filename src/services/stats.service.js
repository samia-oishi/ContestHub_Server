import { getDB } from '../config/db.js'

function contestsCollection() {
  return getDB().collection('contests')
}

function usersCollection() {
  return getDB().collection('users')
}

export async function listRecentWinners(limit = 3) {
  const safeLimit = Math.min(Math.max(Number(limit) || 3, 1), 8)
  const winners = await contestsCollection()
    .find(
      {
        winnerName: { $exists: true, $ne: '' },
      },
      {
        projection: {
          title: 1,
          image: 1,
          type: 1,
          prizeMoney: 1,
          winnerName: 1,
          winnerPhoto: 1,
          updatedAt: 1,
        },
      },
    )
    .sort({ updatedAt: -1 })
    .limit(safeLimit)
    .toArray()

  return winners.map((winner) => ({
    _id: winner._id.toString(),
    contestTitle: winner.title,
    contestImage: winner.image,
    contestType: winner.type,
    prizeMoney: winner.prizeMoney || 0,
    winnerName: winner.winnerName,
    winnerPhoto: winner.winnerPhoto || '',
    declaredAt: winner.updatedAt,
  }))
}

export async function listLeaderboard(limit = 20) {
  const safeLimit = Math.min(Math.max(Number(limit) || 20, 1), 50)
  const users = await usersCollection()
    .find(
      { winCount: { $gt: 0 } },
      {
        projection: {
          name: 1,
          email: 1,
          photoURL: 1,
          role: 1,
          winCount: 1,
        },
      },
    )
    .sort({ winCount: -1, name: 1 })
    .limit(safeLimit)
    .toArray()

  return users.map((user, index) => ({
    rank: index + 1,
    _id: user._id.toString(),
    name: user.name || user.email,
    email: user.email,
    photoURL: user.photoURL || '',
    role: user.role || 'user',
    winCount: user.winCount || 0,
  }))
}
