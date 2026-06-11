import { getDB } from '../config/db.js'

function contestsCollection() {
  return getDB().collection('contests')
}

function usersCollection() {
  return getDB().collection('users')
}

function registrationsCollection() {
  return getDB().collection('registrations')
}

function paymentsCollection() {
  return getDB().collection('payments')
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

export async function getDashboardStats() {
  const now = new Date()
  const start = new Date(now)
  start.setDate(now.getDate() - 29)
  start.setHours(0, 0, 0, 0)

  const [
    totalUsers,
    totalContests,
    approvedContests,
    pendingContests,
    rejectedContests,
    totalRegistrations,
    payments,
    categoryCounts,
    dailyRegistrations,
  ] = await Promise.all([
    usersCollection().countDocuments(),
    contestsCollection().countDocuments(),
    contestsCollection().countDocuments({ status: 'approved' }),
    contestsCollection().countDocuments({ status: 'pending' }),
    contestsCollection().countDocuments({ status: 'rejected' }),
    registrationsCollection().countDocuments(),
    paymentsCollection().find({ status: 'succeeded' }).project({ amount: 1 }).toArray(),
    contestsCollection()
      .aggregate([
        { $group: { _id: '$type', total: { $sum: 1 } } },
        { $sort: { total: -1, _id: 1 } },
      ])
      .toArray(),
    registrationsCollection()
      .aggregate([
        { $match: { registeredAt: { $gte: start } } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$registeredAt' } },
            total: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ])
      .toArray(),
  ])

  const revenue = payments.reduce((total, payment) => total + Number(payment.amount || 0), 0)

  return {
    totals: {
      users: totalUsers,
      contests: totalContests,
      approvedContests,
      pendingContests,
      rejectedContests,
      registrations: totalRegistrations,
      revenue,
    },
    statusChart: [
      { name: 'Approved', value: approvedContests },
      { name: 'Pending', value: pendingContests },
      { name: 'Rejected', value: rejectedContests },
    ],
    categoryCounts: categoryCounts.map((item) => ({
      name: item._id || 'Uncategorized',
      total: item.total,
    })),
    registrationTrend: dailyRegistrations.map((item) => ({
      date: item._id,
      total: item.total,
    })),
  }
}

export async function getPublicStats() {
  const [approvedContests, totalUsers, declaredWinners, totalRegistrations] = await Promise.all([
    contestsCollection().countDocuments({ status: 'approved' }),
    usersCollection().countDocuments(),
    contestsCollection().countDocuments({ winnerName: { $exists: true, $ne: '' } }),
    registrationsCollection().countDocuments(),
  ])

  return {
    approvedContests,
    totalUsers,
    declaredWinners,
    totalRegistrations,
  }
}
