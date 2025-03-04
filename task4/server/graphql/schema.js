const { gql } = require('apollo-server-express');

const typeDefs = gql`
  type Product {
    id: ID!
    name: String!
    price: Float!
    description: String
    categories: [String!]
  }

  type Query {
    products: [Product!]!
    productsByCategory(category: String!): [Product!]!
    product(id: ID!): Product
  }
`;

module.exports = typeDefs;