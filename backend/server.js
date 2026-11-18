const express = require('express')
const mongoose = require('mongoose')
const registerSalesAnalytics = require('./salesAnalytics')
const session = require('express-session')
const {
  createHash,
  timingSafeEqual,
  randomUUID,
} = require('node:crypto')
const path = require('node:path')
const fs = require('node:fs/promises')

const app = express()
const port = 5000

const {
  MONGO_URI,
  STAFF_USERNAME,
  STAFF_PASSWORD,
  SESSION_SECRET,
} = process.env

if (
  !MONGO_URI ||
  !STAFF_USERNAME ||
  !STAFF_PASSWORD ||
  !SESSION_SECRET
) {
  throw new Error(
    'Add MONGO_URI, STAFF_USERNAME, STAFF_PASSWORD, and SESSION_SECRET to backend/.env.',
  )
}

app.use(express.json({ limit: '32kb' }))

app.use(
  session({
    name: 'brewdesk.sid',
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 8 * 60 * 60 * 1000,
    },
  }),
)

const categories = [
  'Drinks',
  'Cakes',
  'Buns & Pastries',
  'Sandwiches',
  'Small Bites',
]

const initialMenu = [
  {
    seedKey: 'original-1',
    name: 'Americano',
    price: 550,
    category: 'Drinks',
    image: '/menu/americano.png',
    description: 'Espresso with hot water',
    available: true,
    archived: false,
  },
  {
    seedKey: 'original-2',
    name: 'Cappuccino',
    price: 750,
    category: 'Drinks',
    image: '/menu/cappuccino.png',
    description: 'Espresso with steamed milk and foam',
    available: true,
    archived: false,
  },
  {
    seedKey: 'original-3',
    name: 'Iced Latte',
    price: 950,
    category: 'Drinks',
    image: '/menu/iced-latte.png',
    description: 'Espresso, chilled milk, and ice',
    available: true,
    archived: false,
  },
  {
    seedKey: 'original-4',
    name: 'Caramel Macchiato',
    price: 1050,
    category: 'Drinks',
    image: '/menu/caramel-macchiato.png',
    description: 'Espresso with steamed milk and caramel',
    available: true,
    archived: false,
  },
  {
    seedKey: 'original-5',
    name: 'Iced Mocha',
    price: 1100,
    category: 'Drinks',
    image: '/menu/iced-mocha.png',
    description: 'Chilled espresso with chocolate and milk',
    available: true,
    archived: false,
  },
  {
    seedKey: 'original-6',
    name: 'Fresh Mango Juice',
    price: 750,
    category: 'Drinks',
    image: '/menu/fresh-mango-juice.png',
    description: 'Fresh mango blended into a refreshing juice',
    available: true,
    archived: false,
  },
  {
    seedKey: 'original-7',
    name: 'Watermelon & Lime Juice',
    price: 650,
    category: 'Drinks',
    image: '/menu/watermelon-lime-juice.png',
    description: 'Refreshing watermelon with a splash of lime',
    available: true,
    archived: false,
  },
  {
    seedKey: 'original-8',
    name: 'Chocolate Fudge Cake',
    price: 850,
    category: 'Cakes',
    image: '/menu/chocolate-fudge-cake.png',
    description: 'Rich chocolate cake with smooth fudge frosting',
    available: true,
    archived: false,
  },
  {
    seedKey: 'original-9',
    name: 'Blueberry Cheesecake',
    price: 950,
    category: 'Cakes',
    image: '/menu/blueberry-cheesecake.png',
    description: 'Creamy cheesecake with blueberry topping',
    available: true,
    archived: false,
  },
  {
    seedKey: 'original-10',
    name: 'Cinnamon Bun',
    price: 550,
    category: 'Buns & Pastries',
    image: '/menu/cinnamon-bun.png',
    description: 'Soft cinnamon bun with a sweet glaze',
    available: true,
    archived: false,
  },
  {
    seedKey: 'original-11',
    name: 'Cheese and Onion Bun',
    price: 600,
    category: 'Buns & Pastries',
    image: '/menu/cheese-and-onion-bun.png',
    description: 'A soft savoury bun filled with cheese and onion',
    available: true,
    archived: false,
  },
  {
    seedKey: 'original-12',
    name: 'Chocolate Croissant',
    price: 650,
    category: 'Buns & Pastries',
    image: '/menu/chocolate-croissant.png',
    description: 'Flaky buttery pastry with a chocolate centre',
    available: true,
    archived: false,
  },
  {
    seedKey: 'original-13',
    name: 'Grilled Chicken & Cheese',
    price: 1250,
    category: 'Sandwiches',
    image: '/menu/grilled-chicken-cheese.png',
    description: 'Grilled chicken and melted cheese sandwich',
    available: true,
    archived: false,
  },
  {
    seedKey: 'original-14',
    name: 'Egg Mayo',
    price: 800,
    category: 'Sandwiches',
    image: '/menu/egg-mayo.png',
    description: 'Creamy egg mayonnaise with fresh greens',
    available: true,
    archived: false,
  },
  {
    seedKey: 'original-15',
    name: 'Roasted Veggie & Pesto',
    price: 1050,
    category: 'Sandwiches',
    image: '/menu/roasted-veggie-pesto.png',
    description: 'Roasted vegetables with fragrant pesto',
    available: true,
    archived: false,
  },
  {
    seedKey: 'original-16',
    name: 'Potato Wedges',
    price: 700,
    category: 'Small Bites',
    image: '/menu/potato-wedges.png',
    description: 'Golden seasoned potato wedges',
    available: true,
    archived: false,
  },
  {
    seedKey: 'original-17',
    name: 'Vegetable Spring Rolls',
    price: 650,
    category: 'Small Bites',
    image: '/menu/vegetable-spring-rolls.png',
    description: 'Crispy spring rolls with a vegetable filling',
    available: true,
    archived: false,
  },
]

const uploadDirectory = path.join(__dirname, 'uploads', 'menu')
const pickupSlots = ['16:30', '16:45', '17:00']
const visibleFields = { _id: 0 }

let orders
let counters
let menuItems
let migrations

function hashPassword(value) {
  return createHash('sha256').update(value).digest()
}

function asyncRoute(handler) {
  return (request, response, next) => {
    Promise.resolve()
      .then(() => handler(request, response, next))
      .catch(next)
  }
}

function requireStaff(request, response, next) {
  response.set('Cache-Control', 'no-store')

  if (request.session.staff !== true) {
    return response.status(401).json({
      error: 'Staff sign-in required.',
    })
  }

  next()
}

// Health check

app.get('/api/health', (_request, response) => {
  response.json({
    status: 'ok',
    service: 'BrewDesk API',
  })
})

// Staff login and session

app.post('/api/staff/login', (request, response, next) => {
  const { username, password } = request.body ?? {}

  if (
    username !== STAFF_USERNAME ||
    typeof password !== 'string' ||
    !timingSafeEqual(
      hashPassword(password),
      hashPassword(STAFF_PASSWORD),
    )
  ) {
    return response.status(401).json({
      error: 'Invalid username or password.',
    })
  }

  request.session.regenerate((error) => {
    if (error) return next(error)

    request.session.staff = true

    request.session.save((saveError) => {
      if (saveError) return next(saveError)

      return response.json({ signedIn: true })
    })
  })
})

app.get('/api/staff/session', (request, response) => {
  response.set('Cache-Control', 'no-store')

  response.json({
    signedIn: request.session.staff === true,
  })
})

app.post('/api/staff/logout', (request, response, next) => {
  request.session.destroy((error) => {
    if (error) return next(error)

    response.clearCookie('brewdesk.sid', { path: '/' })

    return response.json({ signedIn: false })
  })
})

// Menu helpers

function menuView(item) {
  return {
    id: item._id.toString(),
    name: item.name,
    description: item.description,
    category: item.category,
    price: item.price,
    image: item.image,
    available: item.available,
    archived: item.archived,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  }
}

function menuId(value) {
  if (
    typeof value !== 'string' ||
    !/^[a-f0-9]{24}$/i.test(value)
  ) {
    return null
  }

  return new mongoose.Types.ObjectId(value)
}

function validateMenu(body) {
  if (
    !body ||
    typeof body !== 'object' ||
    Array.isArray(body)
  ) {
    return { error: 'Provide menu item details.' }
  }

  const name =
    typeof body.name === 'string' ? body.name.trim() : ''

  const description =
    typeof body.description === 'string'
      ? body.description.trim()
      : ''

  const image =
    typeof body.image === 'string' ? body.image.trim() : ''

  if (!name || name.length > 100) {
    return {
      error: 'Enter an item name of up to 100 characters.',
    }
  }

  if (description.length > 500) {
    return {
      error: 'Keep the description within 500 characters.',
    }
  }

  if (!categories.includes(body.category)) {
    return { error: 'Choose a valid category.' }
  }

  if (
    !Number.isSafeInteger(body.price) ||
    body.price < 1 ||
    body.price > 1000000
  ) {
    return {
      error: 'Enter a whole-rupee price between 1 and 1,000,000.',
    }
  }

  const validImage =
    /^\/(?:menu|uploads\/menu)\/[a-zA-Z0-9_-]+\.(?:png|jpe?g|webp)$/i

  if (!validImage.test(image)) {
    return {
      error: 'Choose a PNG, JPG, or WebP product image.',
    }
  }

  if (typeof body.available !== 'boolean') {
    return { error: 'Choose available or sold out.' }
  }

  return {
    value: {
      name,
      nameKey: name.toLowerCase(),
      description,
      category: body.category,
      price: body.price,
      image,
      available: body.available,
    },
  }
}

// Public menu: includes sold-out items, excludes archived items.

app.get(
  '/api/menu',
  asyncRoute(async (_request, response) => {
    const list = await menuItems
      .find({ archived: false })
      .sort({ createdAt: 1, _id: 1 })
      .toArray()

    response.set('Cache-Control', 'no-store')
    response.json(list.map(menuView))
  }),
)

// Staff menu: includes archived items.

app.get(
  '/api/staff/menu',
  requireStaff,
  asyncRoute(async (_request, response) => {
    const list = await menuItems
      .find({})
      .sort({ createdAt: 1, _id: 1 })
      .toArray()

    response.json(list.map(menuView))
  }),
)

// Add a menu item

app.post(
  '/api/staff/menu',
  requireStaff,
  asyncRoute(async (request, response) => {
    const result = validateMenu(request.body)

    if (result.error) {
      return response.status(400).json({
        error: result.error,
      })
    }

    const now = new Date()

    const item = {
      ...result.value,
      archived: false,
      createdAt: now,
      updatedAt: now,
    }

    const inserted = await menuItems.insertOne(item)

    response.status(201).json(
      menuView({
        ...item,
        _id: inserted.insertedId,
      }),
    )
  }),
)

// Edit an item: send all editable fields.

app.patch(
  '/api/staff/menu/:id',
  requireStaff,
  asyncRoute(async (request, response) => {
    const _id = menuId(request.params.id)

    if (!_id) {
      return response.status(400).json({
        error: 'Invalid menu item ID.',
      })
    }

    const result = validateMenu(request.body)

    if (result.error) {
      return response.status(400).json({
        error: result.error,
      })
    }

    const item = await menuItems.findOneAndUpdate(
      { _id },
      {
        $set: {
          ...result.value,
          updatedAt: new Date(),
        },
      },
      {
        returnDocument: 'after',
        includeResultMetadata: false,
      },
    )

    if (!item) {
      return response.status(404).json({
        error: 'Menu item not found.',
      })
    }

    response.json(menuView(item))
  }),
)

// Mark available or sold out

app.patch(
  '/api/staff/menu/:id/availability',
  requireStaff,
  asyncRoute(async (request, response) => {
    const _id = menuId(request.params.id)

    if (!_id) {
      return response.status(400).json({
        error: 'Invalid menu item ID.',
      })
    }

    if (typeof request.body?.available !== 'boolean') {
      return response.status(400).json({
        error: 'Choose available or sold out.',
      })
    }

    const item = await menuItems.findOneAndUpdate(
      { _id },
      {
        $set: {
          available: request.body.available,
          updatedAt: new Date(),
        },
      },
      {
        returnDocument: 'after',
        includeResultMetadata: false,
      },
    )

    if (!item) {
      return response.status(404).json({
        error: 'Menu item not found.',
      })
    }

    response.json(menuView(item))
  }),
)

// Archive or restore an item

app.patch(
  '/api/staff/menu/:id/archive',
  requireStaff,
  asyncRoute(async (request, response) => {
    const _id = menuId(request.params.id)

    if (!_id) {
      return response.status(400).json({
        error: 'Invalid menu item ID.',
      })
    }

    if (typeof request.body?.archived !== 'boolean') {
      return response.status(400).json({
        error: 'Choose whether to archive the item.',
      })
    }

    const item = await menuItems.findOneAndUpdate(
      { _id },
      {
        $set: {
          archived: request.body.archived,
          updatedAt: new Date(),
        },
      },
      {
        returnDocument: 'after',
        includeResultMetadata: false,
      },
    )

    if (!item) {
      return response.status(404).json({
        error: 'Menu item not found.',
      })
    }

    response.json(menuView(item))
  }),
)

// Image upload
// Send the file directly as the body, not FormData.
// Supported types: PNG, JPEG, WebP. Maximum size: 5 MB.

app.post(
  '/api/staff/menu-image',
  requireStaff,
  express.raw({
    type: ['image/png', 'image/jpeg', 'image/webp'],
    limit: '5mb',
  }),
  asyncRoute(async (request, response) => {
    const bytes = request.body

    if (!Buffer.isBuffer(bytes) || bytes.length < 12) {
      return response.status(400).json({
        error: 'Upload a PNG, JPG, or WebP image.',
      })
    }

    const type = request
      .get('Content-Type')
      ?.split(';')[0]
      .trim()
      .toLowerCase()

    const png = bytes.subarray(0, 8).equals(
      Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    )

    const jpg =
      bytes[0] === 255 &&
      bytes[1] === 216 &&
      bytes[2] === 255

    const webp =
      bytes.toString('ascii', 0, 4) === 'RIFF' &&
      bytes.toString('ascii', 8, 12) === 'WEBP'

    const extension =
      type === 'image/png' && png
        ? 'png'
        : type === 'image/jpeg' && jpg
          ? 'jpg'
          : type === 'image/webp' && webp
            ? 'webp'
            : null

    if (!extension) {
      return response.status(400).json({
        error: 'The file does not match its image type.',
      })
    }

    const filename = `${randomUUID()}.${extension}`

    await fs.writeFile(
      path.join(uploadDirectory, filename),
      bytes,
      { flag: 'wx' },
    )

    response.status(201).json({
      image: `/uploads/menu/${filename}`,
    })
  }),
)

// Serve uploaded product images

app.use(
  '/uploads/menu',
  express.static(uploadDirectory, {
    dotfiles: 'deny',
    index: false,
    setHeaders: (response) => {
      response.setHeader('X-Content-Type-Options', 'nosniff')
    },
  }),
)

// Customer checkout

app.post(
  '/api/orders',
  asyncRoute(async (request, response) => {
    const {
      items,
      pickupTime,
      fulfilment = 'pickup',
      delivery,
    } = request.body ?? {}

    if (!['pickup', 'delivery'].includes(fulfilment)) {
      return response.status(400).json({
        error: 'Choose pickup or delivery.',
      })
    }

    if (
      fulfilment === 'pickup' &&
      !pickupSlots.includes(pickupTime)
    ) {
      return response.status(400).json({
        error: 'Choose a valid pickup time.',
      })
    }

    let deliveryDetails = null

    if (fulfilment === 'delivery') {
      const limits = {
        name: 80,
        phone: 25,
        address: 160,
        city: 80,
        note: 200,
      }

      deliveryDetails = {}

      for (const [field, maxLength] of Object.entries(limits)) {
        const value =
          typeof delivery?.[field] === 'string'
            ? delivery[field].trim()
            : ''

        if (
          (field !== 'note' && !value) ||
          value.length > maxLength
        ) {
          return response.status(400).json({
            error: `Check your delivery ${field}.`,
          })
        }

        deliveryDetails[field] = value
      }
    }

    if (
      !Array.isArray(items) ||
      items.length === 0 ||
      items.length > 100
    ) {
      return response.status(400).json({
        error: 'Add a valid selection of menu items.',
      })
    }

    const orderItems = []
    const selectedItems = new Set()

    for (const selection of items) {
      const quantity = selection?.quantity

      if (
        !Number.isInteger(quantity) ||
        quantity < 1 ||
        quantity > 99
      ) {
        return response.status(400).json({
          error: 'Choose quantities between 1 and 99.',
        })
      }

      let product

      // Supports IDs for the new frontend and names for the old one.
      if (selection.id !== undefined) {
        const _id = menuId(selection.id)

        if (!_id) {
          return response.status(400).json({
            error: 'Invalid menu item ID.',
          })
        }

        product = await menuItems.findOne({ _id })
      } else if (typeof selection.name === 'string') {
        product = await menuItems.findOne({
          nameKey: selection.name.trim().toLowerCase(),
        })
      }

      if (
        !product ||
        product.archived ||
        !product.available
      ) {
        return response.status(409).json({
          error:
            'An item is no longer available. Refresh the menu and update your bag.',
        })
      }

      const id = product._id.toString()

      if (selectedItems.has(id)) {
        return response.status(400).json({
          error: 'Combine duplicate items into one quantity.',
        })
      }

      if (
        selection.price !== undefined &&
        selection.price !== product.price
      ) {
        return response.status(409).json({
          error:
            'A menu price has changed. Refresh the menu and review your bag.',
        })
      }

      selectedItems.add(id)

      // Store a snapshot so later menu edits do not alter this order.
       orderItems.push({
  menuItemId: id,
  name: product.name,
  category: product.category,
  quantity,
  price: product.price,
})
    }

    const counter = await counters.findOneAndUpdate(
      { _id: 'orderNumber' },
      { $inc: { value: 1 } },
      {
        returnDocument: 'after',
        includeResultMetadata: false,
      },
    )

    const order = {
      number: counter.value,
      fulfilment,
      pickupTime:
        fulfilment === 'pickup' ? pickupTime : '',
      delivery: deliveryDetails,
      paymentMethod:
        fulfilment === 'pickup'
          ? 'pay_at_pickup'
          : 'cash_on_delivery',
      items: orderItems,
      total: orderItems.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0,
      ),
      status: 'received',
      createdAt: new Date(),
      paidAt: null,
    }

    await orders.insertOne({ ...order })

    return response.status(201).json(order)
  }),
)

// Staff order list

app.get(
  '/api/orders',
  requireStaff,
  asyncRoute(async (_request, response) => {
    const list = await orders
      .find({}, { projection: visibleFields })
      .sort({ createdAt: -1, number: -1 })
      .toArray()

    response.json(list)
  }),
)

// Customer order tracking

app.get(
  '/api/orders/:number/status',
  asyncRoute(async (request, response) => {
    const number = Number(request.params.number)

    if (!Number.isSafeInteger(number) || number < 1) {
      return response.status(400).json({
        error: 'Invalid order number.',
      })
    }

    const order = await orders.findOne(
      { number },
      {
        projection: {
          status: 1,
          paidAt: 1,
        },
      },
    )

    if (!order) {
      return response.status(404).json({
        error: 'Order not found.',
      })
    }

    response.set('Cache-Control', 'no-store')

    return response.json({
      status: order.status,
      paidAt: order.paidAt ?? null,
    })
  }),
)

// Staff order actions

app.patch(
  '/api/orders/:number/status',
  requireStaff,
  asyncRoute(async (request, response) => {
    const number = Number(request.params.number)
    const { status } = request.body ?? {}

    if (!Number.isSafeInteger(number) || number < 1) {
      return response.status(400).json({
        error: 'Invalid order number.',
      })
    }

    const now = new Date()

    const pickupOrder = {
      fulfilment: { $in: ['pickup', null] },
    }

    const actions = new Map([
      [
        'preparing',
        [
          { status: 'received' },
          {
            status: 'preparing',
            preparingAt: now,
          },
        ],
      ],
      [
        'ready',
        [
          { status: 'preparing' },
          {
            status: 'ready',
            readyAt: now,
          },
        ],
      ],
      [
        'paid',
        [
          {
            status: {
              $in: ['ready', 'out_for_delivery'],
            },
            paidAt: null,
          },
          { paidAt: now },
        ],
      ],
      [
        'collected',
        [
          {
            ...pickupOrder,
            status: 'ready',
            paidAt: { $type: 'date' },
          },
          {
            status: 'collected',
            collectedAt: now,
          },
        ],
      ],
      [
        'out_for_delivery',
        [
          {
            fulfilment: 'delivery',
            status: 'ready',
          },
          {
            status: 'out_for_delivery',
            dispatchedAt: now,
          },
        ],
      ],
      [
        'delivered',
        [
          {
            fulfilment: 'delivery',
            status: 'out_for_delivery',
            paidAt: { $type: 'date' },
          },
          {
            status: 'delivered',
            deliveredAt: now,
          },
        ],
      ],
    ])

    const action = actions.get(status)

    if (!action) {
      return response.status(400).json({
        error: 'Choose a valid order action.',
      })
    }

    const [condition, changes] = action

    const updatedOrder = await orders.findOneAndUpdate(
      { number, ...condition },
      { $set: changes },
      {
        returnDocument: 'after',
        includeResultMetadata: false,
        projection: visibleFields,
      },
    )

    if (updatedOrder) {
      return response.json(updatedOrder)
    }

    const existingOrder = await orders.findOne(
      { number },
      { projection: visibleFields },
    )

    if (!existingOrder) {
      return response.status(404).json({
        error: 'Order not found. Refresh the list.',
      })
    }

    if (
      existingOrder.status === status ||
      (status === 'paid' && existingOrder.paidAt)
    ) {
      return response.json(existingOrder)
    }

    return response.status(409).json({
      error:
        'This action is unavailable for the current order status. Refresh the list.',
    })
  }),
)

// Error handler
registerSalesAnalytics(
  app,
  requireStaff,
  () => mongoose.connection.db,
)

app.use((error, _request, response, _next) => {
  if (error.code === 11000) {
    return response.status(409).json({
      error:
        'An item with this name already exists. Edit or restore that item.',
    })
  }

  if (error.type === 'entity.parse.failed') {
    return response.status(400).json({
      error: 'Invalid JSON request.',
    })
  }

  if (error.type === 'entity.too.large') {
    return response.status(413).json({
      error: 'The request is too large.',
    })
  }

  console.error('BrewDesk request failed:', error.name)

  return response.status(500).json({
    error: 'BrewDesk could not complete the request.',
  })
})

// Connect to MongoDB and start the server

async function start() {
  await mongoose.connect(MONGO_URI, {
    dbName: 'brewdesk',
    serverSelectionTimeoutMS: 10000,
  })

  const db = mongoose.connection.db

  orders = db.collection('orders')
  counters = db.collection('counters')
  menuItems = db.collection('menuItems')
  migrations = db.collection('migrations')

  await fs.mkdir(uploadDirectory, { recursive: true })

  await menuItems.createIndex(
    { nameKey: 1 },
    { unique: true },
  )

  await menuItems.createIndex(
    { seedKey: 1 },
    { unique: true, sparse: true },
  )

  // Add the original menu once; preserve later staff edits.
  const menuMigration = await migrations.findOne({
    _id: 'initial-menu-v1',
  })

  if (!menuMigration) {
    const now = new Date()

    await menuItems.bulkWrite(
      initialMenu.map((item) => ({
        updateOne: {
          filter: { seedKey: item.seedKey },
          update: {
            $setOnInsert: {
              ...item,
              nameKey: item.name.toLowerCase(),
              createdAt: now,
              updatedAt: now,
            },
          },
          upsert: true,
        },
      })),
    )

    await migrations.updateOne(
      { _id: 'initial-menu-v1' },
      {
        $setOnInsert: {
          completedAt: now,
        },
      },
      { upsert: true },
    )

    console.log('Initial menu saved to MongoDB (17 items)')
  }

  await orders.createIndex(
    { number: 1 },
    { unique: true },
  )

  const latestOrder = await orders
    .find({})
    .sort({ number: -1 })
    .limit(1)
    .next()

  await counters.updateOne(
    { _id: 'orderNumber' },
    {
      $max: {
        value: Math.max(
          1041,
          latestOrder?.number ?? 1041,
        ),
      },
    },
    { upsert: true },
  )

  const server = app.listen(port, '127.0.0.1', () => {
    console.log('MongoDB connected to brewdesk')
    console.log(
      `BrewDesk API is running at http://127.0.0.1:${port}`,
    )
  })

  server.on('error', async (error) => {
    console.error('BrewDesk server error:', error.message)
    await mongoose.disconnect()
    process.exitCode = 1
  })
}

start().catch(async (error) => {
  console.error('BrewDesk could not start:', error.message)
  await mongoose.disconnect()
  process.exitCode = 1
}) 