const { ApolloServer, gql } = require('apollo-server');
const fs = require('fs');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { PubSub } = require('graphql-subscriptions');

const SECRET = 'MY_SECRET_KEY';
const pubsub = new PubSub(); 

const readJsonFile = (filePath) => {
  try {
    const data = fs.readFileSync(filePath);
    return JSON.parse(data);
  } catch (err) {
    if (err.code === 'ENOENT') {
      return [];
    } else {
      throw new Error(`Error reading file: ${filePath}, ${err.message}`);
    }
  }
};

const activitiesData = readJsonFile('./data/activities.json');
const usersFilePath = './data/users.json';
const usersData = readJsonFile(usersFilePath);

const typeDefs = gql`
  type Query {
    mockActivities(user: String): [Activity]
  }

  type Mutation {
    register(email: String!, password: String!): String
    login(email: String!, password: String!): String
  }

  type Activity {
    id: Int
    time: String
    type: String
    distance: String
    calories: String
    bpm: String
    user: String
    userImage: String
    likes: Int
    comments: Int
    imageUrl: String
  }
`;

const resolvers = {
  Query: {
    mockActivities: (parent, args, context) => {
      console.log('mockActivities called with user:', args.user);
      const filteredData = activitiesData.filter(activity => activity.user === args.user);
      return filteredData;
    },
  },
  Mutation: {
    register: async (_, { email, password }) => {
      console.log('Register called with email:', email);
      const existingUser = usersData.find(user => user.email === email);
      if (existingUser) {
        throw new Error('User already exists');
      }
      const hashedPassword = await bcrypt.hash(password, 10);
      const newUser = { id: usersData.length + 1, email, password: hashedPassword };
      usersData.push(newUser);
      fs.writeFileSync(usersFilePath, JSON.stringify(usersData, null, 2));
      return jwt.sign({ email }, SECRET, { expiresIn: '1h' });
    },
    login: async (_, { email, password }) => {
      console.log('Login called with email:', email);
      const user = usersData.find(user => user.email === email);
      if (!user) throw new Error('User not found');
      const valid = await bcrypt.compare(password, user.password);
      if (!valid) throw new Error('Invalid password');
      return jwt.sign({ email }, SECRET, { expiresIn: '1h' });
    },
  },
};

const context = ({ req }) => {
  const token = req.headers.authorization || '';
  if (token) {
    try {
      const user = jwt.verify(token, SECRET);
      return { user };
    } catch (e) {
      console.error('Invalid token', e);
    }
  }
  return {};
};

const server = new ApolloServer({
  typeDefs,
  resolvers,
  context,
});

server.listen().then(({ url }) => {
  console.log(`🚀 Server ready at ${url}`);
});