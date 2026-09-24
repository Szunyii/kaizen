// NOTE: https://shopify.dev/docs/api/customer/latest/objects/OrderReturnInformation
// Page sizes are small on purpose: the return window is 14 days, the shop
// sells three products, and the nested connections multiply query cost.
export const CUSTOMER_RETURNS_QUERY = `#graphql
  fragment ReturnsMoney on MoneyV2 {
    amount
    currencyCode
  }
  fragment ReturnsReason on ReturnReasonDefinition {
    id
    handle
    name
  }
  fragment ReturnsLineItem on LineItem {
    id
    name
    variantTitle
    quantity
    price {
      ...ReturnsMoney
    }
    image {
      altText
      url
      width
      height
    }
    suggestedReturnReasonDefinitions(first: 8) {
      nodes {
        ...ReturnsReason
      }
    }
  }
  fragment ReturnsReturn on Return {
    id
    name
    status
    createdAt
    decline {
      reason
      note
    }
    returnLineItems(first: 20) {
      nodes {
        id
        quantity
        lineItem {
          id
          name
          variantTitle
        }
        returnReasonDefinition {
          ...ReturnsReason
        }
      }
    }
  }
  fragment ReturnsOrder on Order {
    id
    name
    number
    processedAt
    fulfillmentStatus
    returnInformation {
      nonReturnableSummary {
        nonReturnableReasons
      }
      returnableLineItems(first: 20) {
        nodes {
          quantity
          lineItem {
            ...ReturnsLineItem
          }
        }
      }
    }
    returns(first: 5, sortKey: CREATED_AT, reverse: true) {
      nodes {
        ...ReturnsReturn
      }
    }
  }
  query CustomerReturns($language: LanguageCode)
    @inContext(language: $language) {
    customer {
      orders(first: 10, sortKey: PROCESSED_AT, reverse: true) {
        nodes {
          ...ReturnsOrder
        }
      }
    }
  }
`;
