import { ApolloServer, gql, UserInputError } from 'apollo-server'
import { v1 as uuid } from 'uuid'
import bcrypt from 'bcrypt'
import axios from 'axios'

const typeDefs = gql`
  enum YesNo {
    YES
    NO
  }

  type Address {
    street: String!
    city: String!
  }

  type Person {
    id: String!
    name: String!
    email: String!
    password: String!
    address: Address!
    phone: String
    avatar: String
    favs: [String]
    angel: Boolean
  }

  type Query {
    personCount: Int!
    allPersons(phone: YesNo): [Person]!
    findPerson(name: String!): Person
  }

  type Mutation {
    addPerson(
      name: String!
      email: String!
      password: String!
      street: String!
      city: String!
      phone: String
      avatar: String
    ): Person,

    editNumber(
      name: String!
      phone: String!
    ): Person
  }
`

const resolvers = {
  Person: {
    address: (root) => ({
      street: root.street,
      city: root.city
    }),
    angel: (root) => root.name === 'Angel'
  },
  Query: {
    personCount: () => persons.length,
    allPersons: async (root, args) => {
      const { data: personsFromAPI } = await axios.get('http://localhost:3000/persons')
      if (!args.phone) return personsFromAPI

      const byPhone = person => args.phone === 'YES' ? person.phone : !person.phone
      return personsFromAPI.filter(byPhone)
    },
    findPerson: (root, args) => {
      const { name } = args
      return persons.find(person => person.name === name)
    }
  },
  Mutation: {
    addPerson: (root, args) => {
      if (persons.find(person => person.name === args.name)) {
        throw new UserInputError('Name must be unique', {
          invalidArgs: args.name
        })
      }

      const { password } = args
      const person = {
        ...args,
        id: uuid(),
        password: bcrypt.hashSync(password, 10)
      }

      // Store Person
      persons.push(person)

      return person
    },
    editNumber: (root, args) => {
      const personIndex = persons.findIndex(p => p.name === args.name)
      if (personIndex === -1) return null

      const person = persons[personIndex]
      const updatedPerson = { ...person, phone: args.phone }

      // Store Person
      persons[personIndex] = updatedPerson

      return updatedPerson
    }
  }
}

const server = new ApolloServer({
  typeDefs,
  resolvers
})

server
  .listen()
  .then(({ url}) => console.log(`Tu vieja es ready at ${url}`))