/* eslint-disable eslint-comments/disable-enable-pair */
/* eslint-disable eslint-comments/no-unlimited-disable */
/* eslint-disable */
import type * as CustomerAccountAPI from '@shopify/hydrogen/customer-account-api-types';

export type CustomerAddressUpdateMutationVariables = CustomerAccountAPI.Exact<{
  address: CustomerAccountAPI.CustomerAddressInput;
  addressId: CustomerAccountAPI.Scalars['ID']['input'];
  defaultAddress?: CustomerAccountAPI.InputMaybe<
    CustomerAccountAPI.Scalars['Boolean']['input']
  >;
  language?: CustomerAccountAPI.InputMaybe<CustomerAccountAPI.LanguageCode>;
}>;

export type CustomerAddressUpdateMutation = {
  customerAddressUpdate?: CustomerAccountAPI.Maybe<{
    customerAddress?: CustomerAccountAPI.Maybe<
      Pick<CustomerAccountAPI.CustomerAddress, 'id'>
    >;
    userErrors: Array<
      Pick<
        CustomerAccountAPI.UserErrorsCustomerAddressUserErrors,
        'code' | 'field' | 'message'
      >
    >;
  }>;
};

export type CustomerAddressDeleteMutationVariables = CustomerAccountAPI.Exact<{
  addressId: CustomerAccountAPI.Scalars['ID']['input'];
  language?: CustomerAccountAPI.InputMaybe<CustomerAccountAPI.LanguageCode>;
}>;

export type CustomerAddressDeleteMutation = {
  customerAddressDelete?: CustomerAccountAPI.Maybe<
    Pick<
      CustomerAccountAPI.CustomerAddressDeletePayload,
      'deletedAddressId'
    > & {
      userErrors: Array<
        Pick<
          CustomerAccountAPI.UserErrorsCustomerAddressUserErrors,
          'code' | 'field' | 'message'
        >
      >;
    }
  >;
};

export type CustomerAddressCreateMutationVariables = CustomerAccountAPI.Exact<{
  address: CustomerAccountAPI.CustomerAddressInput;
  defaultAddress?: CustomerAccountAPI.InputMaybe<
    CustomerAccountAPI.Scalars['Boolean']['input']
  >;
  language?: CustomerAccountAPI.InputMaybe<CustomerAccountAPI.LanguageCode>;
}>;

export type CustomerAddressCreateMutation = {
  customerAddressCreate?: CustomerAccountAPI.Maybe<{
    customerAddress?: CustomerAccountAPI.Maybe<
      Pick<CustomerAccountAPI.CustomerAddress, 'id'>
    >;
    userErrors: Array<
      Pick<
        CustomerAccountAPI.UserErrorsCustomerAddressUserErrors,
        'code' | 'field' | 'message'
      >
    >;
  }>;
};

export type CustomerFragment = Pick<
  CustomerAccountAPI.Customer,
  'id' | 'firstName' | 'lastName'
> & {
  emailAddress?: CustomerAccountAPI.Maybe<
    Pick<CustomerAccountAPI.CustomerEmailAddress, 'emailAddress'>
  >;
  defaultAddress?: CustomerAccountAPI.Maybe<
    Pick<
      CustomerAccountAPI.CustomerAddress,
      | 'id'
      | 'formatted'
      | 'firstName'
      | 'lastName'
      | 'company'
      | 'address1'
      | 'address2'
      | 'territoryCode'
      | 'zoneCode'
      | 'city'
      | 'zip'
      | 'phoneNumber'
    >
  >;
  addresses: {
    nodes: Array<
      Pick<
        CustomerAccountAPI.CustomerAddress,
        | 'id'
        | 'formatted'
        | 'firstName'
        | 'lastName'
        | 'company'
        | 'address1'
        | 'address2'
        | 'territoryCode'
        | 'zoneCode'
        | 'city'
        | 'zip'
        | 'phoneNumber'
      >
    >;
  };
};

export type AddressFragment = Pick<
  CustomerAccountAPI.CustomerAddress,
  | 'id'
  | 'formatted'
  | 'firstName'
  | 'lastName'
  | 'company'
  | 'address1'
  | 'address2'
  | 'territoryCode'
  | 'zoneCode'
  | 'city'
  | 'zip'
  | 'phoneNumber'
>;

export type CustomerDetailsQueryVariables = CustomerAccountAPI.Exact<{
  language?: CustomerAccountAPI.InputMaybe<CustomerAccountAPI.LanguageCode>;
}>;

export type CustomerDetailsQuery = {
  customer: Pick<
    CustomerAccountAPI.Customer,
    'id' | 'firstName' | 'lastName'
  > & {
    emailAddress?: CustomerAccountAPI.Maybe<
      Pick<CustomerAccountAPI.CustomerEmailAddress, 'emailAddress'>
    >;
    defaultAddress?: CustomerAccountAPI.Maybe<
      Pick<
        CustomerAccountAPI.CustomerAddress,
        | 'id'
        | 'formatted'
        | 'firstName'
        | 'lastName'
        | 'company'
        | 'address1'
        | 'address2'
        | 'territoryCode'
        | 'zoneCode'
        | 'city'
        | 'zip'
        | 'phoneNumber'
      >
    >;
    addresses: {
      nodes: Array<
        Pick<
          CustomerAccountAPI.CustomerAddress,
          | 'id'
          | 'formatted'
          | 'firstName'
          | 'lastName'
          | 'company'
          | 'address1'
          | 'address2'
          | 'territoryCode'
          | 'zoneCode'
          | 'city'
          | 'zip'
          | 'phoneNumber'
        >
      >;
    };
  };
};

export type OrderMoneyFragment = Pick<
  CustomerAccountAPI.MoneyV2,
  'amount' | 'currencyCode'
>;

export type DiscountApplicationFragment = {
  value:
    | ({__typename: 'MoneyV2'} & Pick<
        CustomerAccountAPI.MoneyV2,
        'amount' | 'currencyCode'
      >)
    | ({__typename: 'PricingPercentageValue'} & Pick<
        CustomerAccountAPI.PricingPercentageValue,
        'percentage'
      >);
};

export type OrderLineItemFullFragment = Pick<
  CustomerAccountAPI.LineItem,
  'id' | 'title' | 'quantity' | 'variantTitle'
> & {
  price?: CustomerAccountAPI.Maybe<
    Pick<CustomerAccountAPI.MoneyV2, 'amount' | 'currencyCode'>
  >;
  discountAllocations: Array<{
    allocatedAmount: Pick<
      CustomerAccountAPI.MoneyV2,
      'amount' | 'currencyCode'
    >;
    discountApplication: {
      value:
        | ({__typename: 'MoneyV2'} & Pick<
            CustomerAccountAPI.MoneyV2,
            'amount' | 'currencyCode'
          >)
        | ({__typename: 'PricingPercentageValue'} & Pick<
            CustomerAccountAPI.PricingPercentageValue,
            'percentage'
          >);
    };
  }>;
  totalDiscount: Pick<CustomerAccountAPI.MoneyV2, 'amount' | 'currencyCode'>;
  image?: CustomerAccountAPI.Maybe<
    Pick<
      CustomerAccountAPI.Image,
      'altText' | 'height' | 'url' | 'id' | 'width'
    >
  >;
};

export type OrderFragment = Pick<
  CustomerAccountAPI.Order,
  | 'id'
  | 'name'
  | 'confirmationNumber'
  | 'statusPageUrl'
  | 'fulfillmentStatus'
  | 'processedAt'
> & {
  fulfillments: {nodes: Array<Pick<CustomerAccountAPI.Fulfillment, 'status'>>};
  totalTax?: CustomerAccountAPI.Maybe<
    Pick<CustomerAccountAPI.MoneyV2, 'amount' | 'currencyCode'>
  >;
  totalPrice: Pick<CustomerAccountAPI.MoneyV2, 'amount' | 'currencyCode'>;
  subtotal?: CustomerAccountAPI.Maybe<
    Pick<CustomerAccountAPI.MoneyV2, 'amount' | 'currencyCode'>
  >;
  shippingAddress?: CustomerAccountAPI.Maybe<
    Pick<
      CustomerAccountAPI.CustomerAddress,
      'name' | 'formatted' | 'formattedArea'
    >
  >;
  discountApplications: {
    nodes: Array<{
      value:
        | ({__typename: 'MoneyV2'} & Pick<
            CustomerAccountAPI.MoneyV2,
            'amount' | 'currencyCode'
          >)
        | ({__typename: 'PricingPercentageValue'} & Pick<
            CustomerAccountAPI.PricingPercentageValue,
            'percentage'
          >);
    }>;
  };
  lineItems: {
    nodes: Array<
      Pick<
        CustomerAccountAPI.LineItem,
        'id' | 'title' | 'quantity' | 'variantTitle'
      > & {
        price?: CustomerAccountAPI.Maybe<
          Pick<CustomerAccountAPI.MoneyV2, 'amount' | 'currencyCode'>
        >;
        discountAllocations: Array<{
          allocatedAmount: Pick<
            CustomerAccountAPI.MoneyV2,
            'amount' | 'currencyCode'
          >;
          discountApplication: {
            value:
              | ({__typename: 'MoneyV2'} & Pick<
                  CustomerAccountAPI.MoneyV2,
                  'amount' | 'currencyCode'
                >)
              | ({__typename: 'PricingPercentageValue'} & Pick<
                  CustomerAccountAPI.PricingPercentageValue,
                  'percentage'
                >);
          };
        }>;
        totalDiscount: Pick<
          CustomerAccountAPI.MoneyV2,
          'amount' | 'currencyCode'
        >;
        image?: CustomerAccountAPI.Maybe<
          Pick<
            CustomerAccountAPI.Image,
            'altText' | 'height' | 'url' | 'id' | 'width'
          >
        >;
      }
    >;
  };
};

export type OrderQueryVariables = CustomerAccountAPI.Exact<{
  orderId: CustomerAccountAPI.Scalars['ID']['input'];
  language?: CustomerAccountAPI.InputMaybe<CustomerAccountAPI.LanguageCode>;
}>;

export type OrderQuery = {
  order?: CustomerAccountAPI.Maybe<
    Pick<
      CustomerAccountAPI.Order,
      | 'id'
      | 'name'
      | 'confirmationNumber'
      | 'statusPageUrl'
      | 'fulfillmentStatus'
      | 'processedAt'
    > & {
      fulfillments: {
        nodes: Array<Pick<CustomerAccountAPI.Fulfillment, 'status'>>;
      };
      totalTax?: CustomerAccountAPI.Maybe<
        Pick<CustomerAccountAPI.MoneyV2, 'amount' | 'currencyCode'>
      >;
      totalPrice: Pick<CustomerAccountAPI.MoneyV2, 'amount' | 'currencyCode'>;
      subtotal?: CustomerAccountAPI.Maybe<
        Pick<CustomerAccountAPI.MoneyV2, 'amount' | 'currencyCode'>
      >;
      shippingAddress?: CustomerAccountAPI.Maybe<
        Pick<
          CustomerAccountAPI.CustomerAddress,
          'name' | 'formatted' | 'formattedArea'
        >
      >;
      discountApplications: {
        nodes: Array<{
          value:
            | ({__typename: 'MoneyV2'} & Pick<
                CustomerAccountAPI.MoneyV2,
                'amount' | 'currencyCode'
              >)
            | ({__typename: 'PricingPercentageValue'} & Pick<
                CustomerAccountAPI.PricingPercentageValue,
                'percentage'
              >);
        }>;
      };
      lineItems: {
        nodes: Array<
          Pick<
            CustomerAccountAPI.LineItem,
            'id' | 'title' | 'quantity' | 'variantTitle'
          > & {
            price?: CustomerAccountAPI.Maybe<
              Pick<CustomerAccountAPI.MoneyV2, 'amount' | 'currencyCode'>
            >;
            discountAllocations: Array<{
              allocatedAmount: Pick<
                CustomerAccountAPI.MoneyV2,
                'amount' | 'currencyCode'
              >;
              discountApplication: {
                value:
                  | ({__typename: 'MoneyV2'} & Pick<
                      CustomerAccountAPI.MoneyV2,
                      'amount' | 'currencyCode'
                    >)
                  | ({__typename: 'PricingPercentageValue'} & Pick<
                      CustomerAccountAPI.PricingPercentageValue,
                      'percentage'
                    >);
              };
            }>;
            totalDiscount: Pick<
              CustomerAccountAPI.MoneyV2,
              'amount' | 'currencyCode'
            >;
            image?: CustomerAccountAPI.Maybe<
              Pick<
                CustomerAccountAPI.Image,
                'altText' | 'height' | 'url' | 'id' | 'width'
              >
            >;
          }
        >;
      };
    }
  >;
};

export type OrderItemFragment = Pick<
  CustomerAccountAPI.Order,
  | 'financialStatus'
  | 'fulfillmentStatus'
  | 'id'
  | 'number'
  | 'confirmationNumber'
  | 'processedAt'
> & {
  totalPrice: Pick<CustomerAccountAPI.MoneyV2, 'amount' | 'currencyCode'>;
  fulfillments: {nodes: Array<Pick<CustomerAccountAPI.Fulfillment, 'status'>>};
};

export type CustomerOrdersFragment = {
  orders: {
    nodes: Array<
      Pick<
        CustomerAccountAPI.Order,
        | 'financialStatus'
        | 'fulfillmentStatus'
        | 'id'
        | 'number'
        | 'confirmationNumber'
        | 'processedAt'
      > & {
        totalPrice: Pick<CustomerAccountAPI.MoneyV2, 'amount' | 'currencyCode'>;
        fulfillments: {
          nodes: Array<Pick<CustomerAccountAPI.Fulfillment, 'status'>>;
        };
      }
    >;
    pageInfo: Pick<
      CustomerAccountAPI.PageInfo,
      'hasPreviousPage' | 'hasNextPage' | 'endCursor' | 'startCursor'
    >;
  };
};

export type CustomerOrdersQueryVariables = CustomerAccountAPI.Exact<{
  endCursor?: CustomerAccountAPI.InputMaybe<
    CustomerAccountAPI.Scalars['String']['input']
  >;
  first?: CustomerAccountAPI.InputMaybe<
    CustomerAccountAPI.Scalars['Int']['input']
  >;
  last?: CustomerAccountAPI.InputMaybe<
    CustomerAccountAPI.Scalars['Int']['input']
  >;
  startCursor?: CustomerAccountAPI.InputMaybe<
    CustomerAccountAPI.Scalars['String']['input']
  >;
  query?: CustomerAccountAPI.InputMaybe<
    CustomerAccountAPI.Scalars['String']['input']
  >;
  language?: CustomerAccountAPI.InputMaybe<CustomerAccountAPI.LanguageCode>;
}>;

export type CustomerOrdersQuery = {
  customer: {
    orders: {
      nodes: Array<
        Pick<
          CustomerAccountAPI.Order,
          | 'financialStatus'
          | 'fulfillmentStatus'
          | 'id'
          | 'number'
          | 'confirmationNumber'
          | 'processedAt'
        > & {
          totalPrice: Pick<
            CustomerAccountAPI.MoneyV2,
            'amount' | 'currencyCode'
          >;
          fulfillments: {
            nodes: Array<Pick<CustomerAccountAPI.Fulfillment, 'status'>>;
          };
        }
      >;
      pageInfo: Pick<
        CustomerAccountAPI.PageInfo,
        'hasPreviousPage' | 'hasNextPage' | 'endCursor' | 'startCursor'
      >;
    };
  };
};

export type ReturnsMoneyFragment = Pick<
  CustomerAccountAPI.MoneyV2,
  'amount' | 'currencyCode'
>;

export type ReturnsReasonFragment = Pick<
  CustomerAccountAPI.ReturnReasonDefinition,
  'id' | 'handle' | 'name'
>;

export type ReturnsLineItemFragment = Pick<
  CustomerAccountAPI.LineItem,
  'id' | 'name' | 'variantTitle' | 'quantity'
> & {
  price?: CustomerAccountAPI.Maybe<
    Pick<CustomerAccountAPI.MoneyV2, 'amount' | 'currencyCode'>
  >;
  image?: CustomerAccountAPI.Maybe<
    Pick<CustomerAccountAPI.Image, 'altText' | 'url' | 'width' | 'height'>
  >;
  suggestedReturnReasonDefinitions?: CustomerAccountAPI.Maybe<{
    nodes: Array<
      Pick<CustomerAccountAPI.ReturnReasonDefinition, 'id' | 'handle' | 'name'>
    >;
  }>;
};

export type ReturnsReturnFragment = Pick<
  CustomerAccountAPI.Return,
  'id' | 'name' | 'status' | 'createdAt'
> & {
  decline?: CustomerAccountAPI.Maybe<
    Pick<CustomerAccountAPI.ReturnDecline, 'reason' | 'note'>
  >;
  returnLineItems: {
    nodes: Array<
      | (Pick<CustomerAccountAPI.ReturnLineItem, 'id' | 'quantity'> & {
          lineItem: Pick<
            CustomerAccountAPI.LineItem,
            'id' | 'name' | 'variantTitle'
          >;
          returnReasonDefinition?: CustomerAccountAPI.Maybe<
            Pick<
              CustomerAccountAPI.ReturnReasonDefinition,
              'id' | 'handle' | 'name'
            >
          >;
        })
      | (Pick<
          CustomerAccountAPI.UnverifiedReturnLineItem,
          'id' | 'quantity'
        > & {
          lineItem: Pick<
            CustomerAccountAPI.LineItem,
            'id' | 'name' | 'variantTitle'
          >;
          returnReasonDefinition?: CustomerAccountAPI.Maybe<
            Pick<
              CustomerAccountAPI.ReturnReasonDefinition,
              'id' | 'handle' | 'name'
            >
          >;
        })
    >;
  };
};

export type ReturnsOrderFragment = Pick<
  CustomerAccountAPI.Order,
  'id' | 'name' | 'number' | 'processedAt' | 'fulfillmentStatus'
> & {
  returnInformation: {
    nonReturnableSummary?: CustomerAccountAPI.Maybe<
      Pick<CustomerAccountAPI.OrderNonReturnableSummary, 'nonReturnableReasons'>
    >;
    returnableLineItems: {
      nodes: Array<
        Pick<CustomerAccountAPI.ReturnableLineItem, 'quantity'> & {
          lineItem: Pick<
            CustomerAccountAPI.LineItem,
            'id' | 'name' | 'variantTitle' | 'quantity'
          > & {
            price?: CustomerAccountAPI.Maybe<
              Pick<CustomerAccountAPI.MoneyV2, 'amount' | 'currencyCode'>
            >;
            image?: CustomerAccountAPI.Maybe<
              Pick<
                CustomerAccountAPI.Image,
                'altText' | 'url' | 'width' | 'height'
              >
            >;
            suggestedReturnReasonDefinitions?: CustomerAccountAPI.Maybe<{
              nodes: Array<
                Pick<
                  CustomerAccountAPI.ReturnReasonDefinition,
                  'id' | 'handle' | 'name'
                >
              >;
            }>;
          };
        }
      >;
    };
  };
  returns: {
    nodes: Array<
      Pick<
        CustomerAccountAPI.Return,
        'id' | 'name' | 'status' | 'createdAt'
      > & {
        decline?: CustomerAccountAPI.Maybe<
          Pick<CustomerAccountAPI.ReturnDecline, 'reason' | 'note'>
        >;
        returnLineItems: {
          nodes: Array<
            | (Pick<CustomerAccountAPI.ReturnLineItem, 'id' | 'quantity'> & {
                lineItem: Pick<
                  CustomerAccountAPI.LineItem,
                  'id' | 'name' | 'variantTitle'
                >;
                returnReasonDefinition?: CustomerAccountAPI.Maybe<
                  Pick<
                    CustomerAccountAPI.ReturnReasonDefinition,
                    'id' | 'handle' | 'name'
                  >
                >;
              })
            | (Pick<
                CustomerAccountAPI.UnverifiedReturnLineItem,
                'id' | 'quantity'
              > & {
                lineItem: Pick<
                  CustomerAccountAPI.LineItem,
                  'id' | 'name' | 'variantTitle'
                >;
                returnReasonDefinition?: CustomerAccountAPI.Maybe<
                  Pick<
                    CustomerAccountAPI.ReturnReasonDefinition,
                    'id' | 'handle' | 'name'
                  >
                >;
              })
          >;
        };
      }
    >;
  };
};

export type CustomerReturnsQueryVariables = CustomerAccountAPI.Exact<{
  language?: CustomerAccountAPI.InputMaybe<CustomerAccountAPI.LanguageCode>;
}>;

export type CustomerReturnsQuery = {
  customer: {
    orders: {
      nodes: Array<
        Pick<
          CustomerAccountAPI.Order,
          'id' | 'name' | 'number' | 'processedAt' | 'fulfillmentStatus'
        > & {
          returnInformation: {
            nonReturnableSummary?: CustomerAccountAPI.Maybe<
              Pick<
                CustomerAccountAPI.OrderNonReturnableSummary,
                'nonReturnableReasons'
              >
            >;
            returnableLineItems: {
              nodes: Array<
                Pick<CustomerAccountAPI.ReturnableLineItem, 'quantity'> & {
                  lineItem: Pick<
                    CustomerAccountAPI.LineItem,
                    'id' | 'name' | 'variantTitle' | 'quantity'
                  > & {
                    price?: CustomerAccountAPI.Maybe<
                      Pick<
                        CustomerAccountAPI.MoneyV2,
                        'amount' | 'currencyCode'
                      >
                    >;
                    image?: CustomerAccountAPI.Maybe<
                      Pick<
                        CustomerAccountAPI.Image,
                        'altText' | 'url' | 'width' | 'height'
                      >
                    >;
                    suggestedReturnReasonDefinitions?: CustomerAccountAPI.Maybe<{
                      nodes: Array<
                        Pick<
                          CustomerAccountAPI.ReturnReasonDefinition,
                          'id' | 'handle' | 'name'
                        >
                      >;
                    }>;
                  };
                }
              >;
            };
          };
          returns: {
            nodes: Array<
              Pick<
                CustomerAccountAPI.Return,
                'id' | 'name' | 'status' | 'createdAt'
              > & {
                decline?: CustomerAccountAPI.Maybe<
                  Pick<CustomerAccountAPI.ReturnDecline, 'reason' | 'note'>
                >;
                returnLineItems: {
                  nodes: Array<
                    | (Pick<
                        CustomerAccountAPI.ReturnLineItem,
                        'id' | 'quantity'
                      > & {
                        lineItem: Pick<
                          CustomerAccountAPI.LineItem,
                          'id' | 'name' | 'variantTitle'
                        >;
                        returnReasonDefinition?: CustomerAccountAPI.Maybe<
                          Pick<
                            CustomerAccountAPI.ReturnReasonDefinition,
                            'id' | 'handle' | 'name'
                          >
                        >;
                      })
                    | (Pick<
                        CustomerAccountAPI.UnverifiedReturnLineItem,
                        'id' | 'quantity'
                      > & {
                        lineItem: Pick<
                          CustomerAccountAPI.LineItem,
                          'id' | 'name' | 'variantTitle'
                        >;
                        returnReasonDefinition?: CustomerAccountAPI.Maybe<
                          Pick<
                            CustomerAccountAPI.ReturnReasonDefinition,
                            'id' | 'handle' | 'name'
                          >
                        >;
                      })
                  >;
                };
              }
            >;
          };
        }
      >;
    };
  };
};

export type CustomerUpdateMutationVariables = CustomerAccountAPI.Exact<{
  customer: CustomerAccountAPI.CustomerUpdateInput;
  language?: CustomerAccountAPI.InputMaybe<CustomerAccountAPI.LanguageCode>;
}>;

export type CustomerUpdateMutation = {
  customerUpdate?: CustomerAccountAPI.Maybe<{
    customer?: CustomerAccountAPI.Maybe<
      Pick<CustomerAccountAPI.Customer, 'firstName' | 'lastName'> & {
        emailAddress?: CustomerAccountAPI.Maybe<
          Pick<CustomerAccountAPI.CustomerEmailAddress, 'emailAddress'>
        >;
        phoneNumber?: CustomerAccountAPI.Maybe<
          Pick<CustomerAccountAPI.CustomerPhoneNumber, 'phoneNumber'>
        >;
      }
    >;
    userErrors: Array<
      Pick<
        CustomerAccountAPI.UserErrorsCustomerUserErrors,
        'code' | 'field' | 'message'
      >
    >;
  }>;
};

export type OrderRequestReturnMutationVariables = CustomerAccountAPI.Exact<{
  orderId: CustomerAccountAPI.Scalars['ID']['input'];
  requestedLineItems:
    | Array<CustomerAccountAPI.RequestedLineItemInput>
    | CustomerAccountAPI.RequestedLineItemInput;
  language?: CustomerAccountAPI.InputMaybe<CustomerAccountAPI.LanguageCode>;
}>;

export type OrderRequestReturnMutation = {
  orderRequestReturn?: CustomerAccountAPI.Maybe<{
    return?: CustomerAccountAPI.Maybe<
      Pick<CustomerAccountAPI.Return, 'id' | 'name' | 'status'>
    >;
    userErrors: Array<
      Pick<CustomerAccountAPI.ReturnUserError, 'field' | 'message' | 'code'>
    >;
  }>;
};

interface GeneratedQueryTypes {
  '#graphql\n  query CustomerDetails($language: LanguageCode) @inContext(language: $language) {\n    customer {\n      ...Customer\n    }\n  }\n  #graphql\n  fragment Customer on Customer {\n    id\n    firstName\n    lastName\n    emailAddress {\n      emailAddress\n    }\n    defaultAddress {\n      ...Address\n    }\n    addresses(first: 6) {\n      nodes {\n        ...Address\n      }\n    }\n  }\n  fragment Address on CustomerAddress {\n    id\n    formatted\n    firstName\n    lastName\n    company\n    address1\n    address2\n    territoryCode\n    zoneCode\n    city\n    zip\n    phoneNumber\n  }\n\n': {
    return: CustomerDetailsQuery;
    variables: CustomerDetailsQueryVariables;
  };
  '#graphql\n  fragment OrderMoney on MoneyV2 {\n    amount\n    currencyCode\n  }\n  fragment DiscountApplication on DiscountApplication {\n    value {\n      __typename\n      ... on MoneyV2 {\n        ...OrderMoney\n      }\n      ... on PricingPercentageValue {\n        percentage\n      }\n    }\n  }\n  fragment OrderLineItemFull on LineItem {\n    id\n    title\n    quantity\n    price {\n      ...OrderMoney\n    }\n    discountAllocations {\n      allocatedAmount {\n        ...OrderMoney\n      }\n      discountApplication {\n        ...DiscountApplication\n      }\n    }\n    totalDiscount {\n      ...OrderMoney\n    }\n    image {\n      altText\n      height\n      url\n      id\n      width\n    }\n    variantTitle\n  }\n  fragment Order on Order {\n    id\n    name\n    confirmationNumber\n    statusPageUrl\n    fulfillmentStatus\n    processedAt\n    fulfillments(first: 1) {\n      nodes {\n        status\n      }\n    }\n    totalTax {\n      ...OrderMoney\n    }\n    totalPrice {\n      ...OrderMoney\n    }\n    subtotal {\n      ...OrderMoney\n    }\n    shippingAddress {\n      name\n      formatted(withName: true)\n      formattedArea\n    }\n    discountApplications(first: 100) {\n      nodes {\n        ...DiscountApplication\n      }\n    }\n    lineItems(first: 100) {\n      nodes {\n        ...OrderLineItemFull\n      }\n    }\n  }\n  query Order($orderId: ID!, $language: LanguageCode)\n    @inContext(language: $language) {\n    order(id: $orderId) {\n      ... on Order {\n        ...Order\n      }\n    }\n  }\n': {
    return: OrderQuery;
    variables: OrderQueryVariables;
  };
  '#graphql\n  #graphql\n  fragment CustomerOrders on Customer {\n    orders(\n      sortKey: PROCESSED_AT,\n      reverse: true,\n      first: $first,\n      last: $last,\n      before: $startCursor,\n      after: $endCursor,\n      query: $query\n    ) {\n      nodes {\n        ...OrderItem\n      }\n      pageInfo {\n        hasPreviousPage\n        hasNextPage\n        endCursor\n        startCursor\n      }\n    }\n  }\n  #graphql\n  fragment OrderItem on Order {\n    totalPrice {\n      amount\n      currencyCode\n    }\n    financialStatus\n    fulfillmentStatus\n    fulfillments(first: 1) {\n      nodes {\n        status\n      }\n    }\n    id\n    number\n    confirmationNumber\n    processedAt\n  }\n\n\n  query CustomerOrders(\n    $endCursor: String\n    $first: Int\n    $last: Int\n    $startCursor: String\n    $query: String\n    $language: LanguageCode\n  ) @inContext(language: $language) {\n    customer {\n      ...CustomerOrders\n    }\n  }\n': {
    return: CustomerOrdersQuery;
    variables: CustomerOrdersQueryVariables;
  };
  '#graphql\n  fragment ReturnsMoney on MoneyV2 {\n    amount\n    currencyCode\n  }\n  fragment ReturnsReason on ReturnReasonDefinition {\n    id\n    handle\n    name\n  }\n  fragment ReturnsLineItem on LineItem {\n    id\n    name\n    variantTitle\n    quantity\n    price {\n      ...ReturnsMoney\n    }\n    image {\n      altText\n      url\n      width\n      height\n    }\n    suggestedReturnReasonDefinitions(first: 8) {\n      nodes {\n        ...ReturnsReason\n      }\n    }\n  }\n  fragment ReturnsReturn on Return {\n    id\n    name\n    status\n    createdAt\n    decline {\n      reason\n      note\n    }\n    returnLineItems(first: 20) {\n      nodes {\n        id\n        quantity\n        lineItem {\n          id\n          name\n          variantTitle\n        }\n        returnReasonDefinition {\n          ...ReturnsReason\n        }\n      }\n    }\n  }\n  fragment ReturnsOrder on Order {\n    id\n    name\n    number\n    processedAt\n    fulfillmentStatus\n    returnInformation {\n      nonReturnableSummary {\n        nonReturnableReasons\n      }\n      returnableLineItems(first: 20) {\n        nodes {\n          quantity\n          lineItem {\n            ...ReturnsLineItem\n          }\n        }\n      }\n    }\n    returns(first: 5, sortKey: CREATED_AT, reverse: true) {\n      nodes {\n        ...ReturnsReturn\n      }\n    }\n  }\n  query CustomerReturns($language: LanguageCode)\n    @inContext(language: $language) {\n    customer {\n      orders(first: 10, sortKey: PROCESSED_AT, reverse: true) {\n        nodes {\n          ...ReturnsOrder\n        }\n      }\n    }\n  }\n': {
    return: CustomerReturnsQuery;
    variables: CustomerReturnsQueryVariables;
  };
}

interface GeneratedMutationTypes {
  '#graphql\n  mutation customerAddressUpdate(\n    $address: CustomerAddressInput!\n    $addressId: ID!\n    $defaultAddress: Boolean\n    $language: LanguageCode\n ) @inContext(language: $language) {\n    customerAddressUpdate(\n      address: $address\n      addressId: $addressId\n      defaultAddress: $defaultAddress\n    ) {\n      customerAddress {\n        id\n      }\n      userErrors {\n        code\n        field\n        message\n      }\n    }\n  }\n': {
    return: CustomerAddressUpdateMutation;
    variables: CustomerAddressUpdateMutationVariables;
  };
  '#graphql\n  mutation customerAddressDelete(\n    $addressId: ID!\n    $language: LanguageCode\n  ) @inContext(language: $language) {\n    customerAddressDelete(addressId: $addressId) {\n      deletedAddressId\n      userErrors {\n        code\n        field\n        message\n      }\n    }\n  }\n': {
    return: CustomerAddressDeleteMutation;
    variables: CustomerAddressDeleteMutationVariables;
  };
  '#graphql\n  mutation customerAddressCreate(\n    $address: CustomerAddressInput!\n    $defaultAddress: Boolean\n    $language: LanguageCode\n  ) @inContext(language: $language) {\n    customerAddressCreate(\n      address: $address\n      defaultAddress: $defaultAddress\n    ) {\n      customerAddress {\n        id\n      }\n      userErrors {\n        code\n        field\n        message\n      }\n    }\n  }\n': {
    return: CustomerAddressCreateMutation;
    variables: CustomerAddressCreateMutationVariables;
  };
  '#graphql\n  mutation customerUpdate(\n    $customer: CustomerUpdateInput!\n    $language: LanguageCode\n  ) @inContext(language: $language) {\n    customerUpdate(input: $customer) {\n      customer {\n        firstName\n        lastName\n        emailAddress {\n          emailAddress\n        }\n        phoneNumber {\n          phoneNumber\n        }\n      }\n      userErrors {\n        code\n        field\n        message\n      }\n    }\n  }\n': {
    return: CustomerUpdateMutation;
    variables: CustomerUpdateMutationVariables;
  };
  '#graphql\n  mutation OrderRequestReturn(\n    $orderId: ID!\n    $requestedLineItems: [RequestedLineItemInput!]!\n    $language: LanguageCode\n  ) @inContext(language: $language) {\n    orderRequestReturn(\n      orderId: $orderId\n      requestedLineItems: $requestedLineItems\n    ) {\n      return {\n        id\n        name\n        status\n      }\n      userErrors {\n        field\n        message\n        code\n      }\n    }\n  }\n': {
    return: OrderRequestReturnMutation;
    variables: OrderRequestReturnMutationVariables;
  };
}

declare module '@shopify/hydrogen' {
  interface CustomerAccountQueries extends GeneratedQueryTypes {}
  interface CustomerAccountMutations extends GeneratedMutationTypes {}
}
