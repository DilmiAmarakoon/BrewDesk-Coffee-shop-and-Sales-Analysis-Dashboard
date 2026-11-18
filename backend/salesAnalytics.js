const TIMEZONE = 'Asia/Colombo'

const CATEGORIES = [
  'Drinks',
  'Cakes',
  'Buns & Pastries',
  'Sandwiches',
  'Small Bites',
  'Uncategorised',
]

function localDate(date) {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date)

  const value = (type) =>
    parts.find((part) => part.type === type)?.value

  return `${value('year')}-${value('month')}-${value('day')}`
}

function validDate(value) {
  if (
    typeof value !== 'string' ||
    !/^\d{4}-\d{2}-\d{2}$/.test(value)
  ) {
    return false
  }

  const date = new Date(`${value}T00:00:00Z`)

  return (
    !Number.isNaN(date.getTime()) &&
    date.toISOString().slice(0, 10) === value
  )
}

function shiftDate(value, days) {
  const date = new Date(`${value}T00:00:00Z`)
  date.setUTCDate(date.getUTCDate() + days)
  return date.toISOString().slice(0, 10)
}

function csvCell(value) {
  let text = String(value ?? '')

  if (/^[\s]*[=+\-@]/.test(text)) {
    text = `'${text}`
  }

  return `"${text.replaceAll('"', '""')}"`
}

module.exports = function registerSalesAnalytics(
  app,
  requireStaff,
  getDatabase,
) {
  app.get(
    '/api/staff/analytics',
    requireStaff,
    async (request, response, next) => {
      try {
        const today = localDate(new Date())

        const from = request.query.from ?? shiftDate(today, -29)
        const to = request.query.to ?? today
        const category = request.query.category ?? 'All'
        const fulfilment = request.query.fulfilment ?? 'All'
        const format = request.query.format ?? 'json'
        const page = Number(request.query.page ?? 1)
        const pageSize = 20

        if (!validDate(from) || !validDate(to)) {
          return response.status(400).json({
            error: 'Choose valid start and end dates.',
          })
        }

        const dayCount =
          (
            new Date(`${to}T00:00:00Z`) -
            new Date(`${from}T00:00:00Z`)
          ) / 86400000 + 1

        if (dayCount < 1 || dayCount > 366) {
          return response.status(400).json({
            error: 'Choose a date range of 1 to 366 days.',
          })
        }

        if (category !== 'All' && !CATEGORIES.includes(category)) {
          return response.status(400).json({
            error: 'Choose a valid category.',
          })
        }

        if (!['All', 'pickup', 'delivery'].includes(fulfilment)) {
          return response.status(400).json({
            error: 'Choose a valid order type.',
          })
        }

        if (!['json', 'csv'].includes(format)) {
          return response.status(400).json({
            error: 'Choose JSON or CSV.',
          })
        }

        if (
          !Number.isSafeInteger(page) ||
          page < 1 ||
          page > 100000
        ) {
          return response.status(400).json({
            error: 'Choose a valid page number.',
          })
        }

        const start = new Date(`${from}T00:00:00+05:30`)
        const end = new Date(
          `${shiftDate(to, 1)}T00:00:00+05:30`,
        )

        const db = getDatabase()

        const pipeline = [
          {
            $match: {
              paidAt: {
                $type: 'date',
                $gte: start,
                $lt: end,
              },
            },
          },
          {
            $set: {
              orderType: {
                $ifNull: ['$fulfilment', 'pickup'],
              },
            },
          },
        ]

        if (fulfilment !== 'All') {
          pipeline.push({
            $match: { orderType: fulfilment },
          })
        }

        pipeline.push(
          { $unwind: '$items' },
          {
            $set: {
              productId: {
                $convert: {
                  input: '$items.menuItemId',
                  to: 'objectId',
                  onError: null,
                  onNull: null,
                },
              },
            },
          },
          {
            $lookup: {
              from: 'menuItems',
              let: {
                productId: '$productId',
                productName: {
                  $toLower: {
                    $trim: {
                      input: { $ifNull: ['$items.name', ''] },
                    },
                  },
                },
              },
              pipeline: [
                {
                  $match: {
                    $expr: {
                      $or: [
                        {
                          $and: [
                            { $ne: ['$$productId', null] },
                            { $eq: ['$_id', '$$productId'] },
                          ],
                        },
                        {
                          $and: [
                            { $eq: ['$$productId', null] },
                            {
                              $eq: [
                                '$nameKey',
                                '$$productName',
                              ],
                            },
                          ],
                        },
                      ],
                    },
                  },
                },
                { $project: { category: 1 } },
                { $limit: 1 },
              ],
              as: 'matchedProduct',
            },
          },
          {
            $set: {
              itemCategory: {
                $ifNull: [
                  '$items.category',
                  {
                    $ifNull: [
                      {
                        $arrayElemAt: [
                          '$matchedProduct.category',
                          0,
                        ],
                      },
                      'Uncategorised',
                    ],
                  },
                ],
              },
              itemKey: {
                $ifNull: [
                  '$items.menuItemId',
                  '$items.name',
                ],
              },
              lineRevenue: {
                $multiply: [
                  '$items.price',
                  '$items.quantity',
                ],
              },
            },
          },
        )

        if (category !== 'All') {
          pipeline.push({
            $match: { itemCategory: category },
          })
        }

        const orderGroup = {
          $group: {
            _id: '$number',
            paidAt: { $first: '$paidAt' },
            fulfilment: { $first: '$orderType' },
            total: { $sum: '$lineRevenue' },
            items: {
              $push: {
                name: '$items.name',
                quantity: '$items.quantity',
                price: '$items.price',
                category: '$itemCategory',
              },
            },
          },
        }

        const orderSort = {
          $sort: { paidAt: -1, _id: -1 },
        }

        const orderProjection = {
          $project: {
            _id: 0,
            number: '$_id',
            paidAt: 1,
            fulfilment: 1,
            total: 1,
            items: 1,
          },
        }

        // Export all matching orders, rather than only the current page.
        if (format === 'csv') {
          const rows = await db
            .collection('orders')
            .aggregate([
              ...pipeline,
              orderGroup,
              orderSort,
              orderProjection,
            ])
            .toArray()

          const header = [
            'Order number',
            'Paid date (Asia/Colombo)',
            'Order type',
            'Sales (Rs.)',
            'Items',
          ]

          const lines = [
            header.map(csvCell).join(','),
            ...rows.map((row) =>
              [
                row.number,
                new Date(row.paidAt).toLocaleString('en-GB', {
                  timeZone: TIMEZONE,
                }),
                row.fulfilment,
                row.total,
                row.items
                  .map((item) => `${item.quantity} x ${item.name}`)
                  .join('; '),
              ]
                .map(csvCell)
                .join(','),
            ),
          ]

          response.set(
            'Content-Type',
            'text/csv; charset=utf-8',
          )

          response.set(
            'Content-Disposition',
            `attachment; filename="brewdesk-sales-${from}-to-${to}.csv"`,
          )

          return response.send('\uFEFF' + lines.join('\r\n'))
        }

        const [result] = await db
          .collection('orders')
          .aggregate([
            ...pipeline,
            {
              $facet: {
                summary: [
                  {
                    $group: {
                      _id: null,
                      paidSales: { $sum: '$lineRevenue' },
                      itemsSold: { $sum: '$items.quantity' },
                      orderNumbers: { $addToSet: '$number' },
                    },
                  },
                  {
                    $project: {
                      _id: 0,
                      paidSales: 1,
                      itemsSold: 1,
                      paidOrders: {
                        $size: '$orderNumbers',
                      },
                    },
                  },
                ],

                trend: [
                  {
                    $group: {
                      _id: {
                        $dateToString: {
                          date: '$paidAt',
                          format: '%Y-%m-%d',
                          timezone: TIMEZONE,
                        },
                      },
                      sales: { $sum: '$lineRevenue' },
                    },
                  },
                  { $sort: { _id: 1 } },
                ],

                topItems: [
                  {
                    $group: {
                      _id: '$itemKey',
                      name: { $last: '$items.name' },
                      quantity: { $sum: '$items.quantity' },
                      sales: { $sum: '$lineRevenue' },
                    },
                  },
                  {
                    $sort: {
                      quantity: -1,
                      sales: -1,
                      _id: 1,
                    },
                  },
                  { $limit: 5 },
                ],

                categorySales: [
                  {
                    $group: {
                      _id: '$itemCategory',
                      sales: { $sum: '$lineRevenue' },
                      quantity: { $sum: '$items.quantity' },
                    },
                  },
                  { $sort: { sales: -1, _id: 1 } },
                ],

                orderTypes: [
                  {
                    $group: {
                      _id: '$orderType',
                      sales: { $sum: '$lineRevenue' },
                      numbers: { $addToSet: '$number' },
                    },
                  },
                  {
                    $project: {
                      sales: 1,
                      orders: { $size: '$numbers' },
                    },
                  },
                ],

                // Count every order once, not once per product.
                hourlyOrders: [
                  {
                    $match: {
                      createdAt: { $type: 'date' },
                    },
                  },
                  {
                    $group: {
                      _id: {
                        hour: {
                          $hour: {
                            date: '$createdAt',
                            timezone: TIMEZONE,
                          },
                        },
                        number: '$number',
                      },
                    },
                  },
                  {
                    $group: {
                      _id: '$_id.hour',
                      orders: { $sum: 1 },
                    },
                  },
                  { $sort: { _id: 1 } },
                ],

                orders: [
                  orderGroup,
                  orderSort,
                  { $skip: (page - 1) * pageSize },
                  { $limit: pageSize },
                  orderProjection,
                ],
              },
            },
          ])
          .toArray()

        const summary = result.summary[0] || {
          paidSales: 0,
          paidOrders: 0,
          itemsSold: 0,
        }

        const trendMap = new Map(
          result.trend.map((point) => [
            point._id,
            point.sales,
          ]),
        )

        const trend = []

        for (
          let date = from;
          date <= to;
          date = shiftDate(date, 1)
        ) {
          trend.push({
            date,
            sales: trendMap.get(date) || 0,
          })
        }

        const hourlyOrders = Array.from(
          { length: 24 },
          (_, hour) => ({
            hour,
            orders:
              result.hourlyOrders.find(
                (item) => item._id === hour,
              )?.orders || 0,
          }),
        )

        response.set('Cache-Control', 'no-store')

        return response.json({
          filters: {
            from,
            to,
            category,
            fulfilment,
          },

          timezone: TIMEZONE,

          summary: {
            ...summary,
            averageOrderValue: summary.paidOrders
              ? summary.paidSales / summary.paidOrders
              : 0,
          },

          trend,
          hourlyOrders,

          topItems: result.topItems.map((item) => ({
            id: item._id,
            name: item.name,
            quantity: item.quantity,
            sales: item.sales,
          })),

          categorySales: result.categorySales.map((item) => ({
            category: item._id,
            sales: item.sales,
            quantity: item.quantity,
          })),

          orderTypes: result.orderTypes.map((item) => ({
            type: item._id,
            sales: item.sales,
            orders: item.orders,
          })),

          orders: result.orders,

          pagination: {
            page,
            pageSize,
            totalOrders: summary.paidOrders,
            totalPages: Math.ceil(
              summary.paidOrders / pageSize,
            ),
          },
        })
      } catch (error) {
        next(error)
      }
    },
  )
} 