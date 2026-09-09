import {
  data,
  Form,
  useActionData,
  useNavigation,
  useOutletContext,
} from 'react-router';
import {
  UPDATE_ADDRESS_MUTATION,
  DELETE_ADDRESS_MUTATION,
  CREATE_ADDRESS_MUTATION,
} from '~/graphql/customer-account/CustomerAddressMutations';

/**
 * @type {Route.MetaFunction}
 */
export const meta = () => {
  return [{title: 'KaizenType — Címek'}];
};

/**
 * @param {Route.LoaderArgs}
 */
export async function loader({context}) {
  await context.customerAccount.handleAuthStatus();

  return {};
}

/**
 * @param {Route.ActionArgs}
 */
export async function action({request, context}) {
  const {customerAccount} = context;

  try {
    const form = await request.formData();

    const addressId = form.has('addressId')
      ? String(form.get('addressId'))
      : null;
    if (!addressId) {
      throw new Error('You must provide an address id.');
    }

    // this will ensure redirecting to login never happen for mutatation
    const isLoggedIn = await customerAccount.isLoggedIn();
    if (!isLoggedIn) {
      return data(
        {error: {[addressId]: 'Unauthorized'}},
        {
          status: 401,
        },
      );
    }

    const defaultAddress = form.has('defaultAddress')
      ? String(form.get('defaultAddress')) === 'on'
      : false;
    const address = {};
    const keys = [
      'address1',
      'address2',
      'city',
      'company',
      'territoryCode',
      'firstName',
      'lastName',
      'phoneNumber',
      'zoneCode',
      'zip',
    ];

    for (const key of keys) {
      const value = form.get(key);
      if (typeof value === 'string') {
        address[key] = value;
      }
    }

    switch (request.method) {
      case 'POST': {
        // handle new address creation
        try {
          const {data, errors} = await customerAccount.mutate(
            CREATE_ADDRESS_MUTATION,
            {
              variables: {
                address,
                defaultAddress,
                language: customerAccount.i18n.language,
              },
            },
          );

          if (errors?.length) {
            throw new Error(errors[0].message);
          }

          if (data?.customerAddressCreate?.userErrors?.length) {
            throw new Error(data?.customerAddressCreate?.userErrors[0].message);
          }

          if (!data?.customerAddressCreate?.customerAddress) {
            throw new Error('Customer address create failed.');
          }

          return {
            error: null,
            createdAddress: data?.customerAddressCreate?.customerAddress,
            defaultAddress,
          };
        } catch (error) {
          if (error instanceof Error) {
            return data(
              {error: {[addressId]: error.message}},
              {
                status: 400,
              },
            );
          }
          return data(
            {error: {[addressId]: error}},
            {
              status: 400,
            },
          );
        }
      }

      case 'PUT': {
        // handle address updates
        try {
          const {data, errors} = await customerAccount.mutate(
            UPDATE_ADDRESS_MUTATION,
            {
              variables: {
                address,
                addressId: decodeURIComponent(addressId),
                defaultAddress,
                language: customerAccount.i18n.language,
              },
            },
          );

          if (errors?.length) {
            throw new Error(errors[0].message);
          }

          if (data?.customerAddressUpdate?.userErrors?.length) {
            throw new Error(data?.customerAddressUpdate?.userErrors[0].message);
          }

          if (!data?.customerAddressUpdate?.customerAddress) {
            throw new Error('Customer address update failed.');
          }

          return {
            error: null,
            updatedAddress: address,
            defaultAddress,
          };
        } catch (error) {
          if (error instanceof Error) {
            return data(
              {error: {[addressId]: error.message}},
              {
                status: 400,
              },
            );
          }
          return data(
            {error: {[addressId]: error}},
            {
              status: 400,
            },
          );
        }
      }

      case 'DELETE': {
        // handles address deletion
        try {
          const {data, errors} = await customerAccount.mutate(
            DELETE_ADDRESS_MUTATION,
            {
              variables: {
                addressId: decodeURIComponent(addressId),
                language: customerAccount.i18n.language,
              },
            },
          );

          if (errors?.length) {
            throw new Error(errors[0].message);
          }

          if (data?.customerAddressDelete?.userErrors?.length) {
            throw new Error(data?.customerAddressDelete?.userErrors[0].message);
          }

          if (!data?.customerAddressDelete?.deletedAddressId) {
            throw new Error('Customer address delete failed.');
          }

          return {error: null, deletedAddress: addressId};
        } catch (error) {
          if (error instanceof Error) {
            return data(
              {error: {[addressId]: error.message}},
              {
                status: 400,
              },
            );
          }
          return data(
            {error: {[addressId]: error}},
            {
              status: 400,
            },
          );
        }
      }

      default: {
        return data(
          {error: {[addressId]: 'Method not allowed'}},
          {
            status: 405,
          },
        );
      }
    }
  } catch (error) {
    if (error instanceof Error) {
      return data(
        {error: error.message},
        {
          status: 400,
        },
      );
    }
    return data(
      {error},
      {
        status: 400,
      },
    );
  }
}

export default function Addresses() {
  const {customer} = useOutletContext();
  const {defaultAddress, addresses} = customer;

  return (
    <div>
      <section>
        <h2 className="acct-sec-h">Mentett címek</h2>
        {!addresses.nodes.length ? (
          <div className="acct-empty">
            <span className="acct-empty-kanji" aria-hidden="true">
              所
            </span>
            <p>Még nincs mentett címed.</p>
          </div>
        ) : (
          <ExistingAddresses
            addresses={addresses}
            defaultAddress={defaultAddress}
          />
        )}
      </section>
      <section className="acct-sec">
        <h2 className="acct-sec-h">Új cím hozzáadása</h2>
        <NewAddressForm key={addresses.nodes.length} />
      </section>
    </div>
  );
}

function NewAddressForm() {
  const newAddress = {
    address1: '',
    address2: '',
    city: '',
    company: '',
    territoryCode: '',
    firstName: '',
    id: 'new',
    lastName: '',
    phoneNumber: '',
    zoneCode: '',
    zip: '',
  };

  return (
    <div className="acct-addr">
      <AddressForm
        addressId={'NEW_ADDRESS_ID'}
        address={newAddress}
        defaultAddress={null}
      >
        {({stateForMethod}) => (
          <div className="acct-actions">
            <button
              className="btn"
              disabled={stateForMethod('POST') !== 'idle'}
              formMethod="POST"
              type="submit"
            >
              {stateForMethod('POST') !== 'idle' ? 'Mentés…' : 'Hozzáadás'}
            </button>
          </div>
        )}
      </AddressForm>
    </div>
  );
}

/**
 * @param {Pick<CustomerFragment, 'addresses' | 'defaultAddress'>}
 */
function ExistingAddresses({addresses, defaultAddress}) {
  return (
    <div className="acct-addr-grid">
      {addresses.nodes.map((address) => (
        <div className="acct-addr" key={address.id}>
          {defaultAddress?.id === address.id && (
            <span className="acct-chip red">Alapértelmezett</span>
          )}
          <AddressForm
            addressId={address.id}
            address={address}
            defaultAddress={defaultAddress}
          >
            {({stateForMethod}) => (
              <div className="acct-actions">
                <button
                  className="btn"
                  disabled={stateForMethod('PUT') !== 'idle'}
                  formMethod="PUT"
                  type="submit"
                >
                  {stateForMethod('PUT') !== 'idle' ? 'Mentés…' : 'Mentés'}
                </button>
                <button
                  className="btn btn-danger"
                  disabled={stateForMethod('DELETE') !== 'idle'}
                  formMethod="DELETE"
                  type="submit"
                >
                  {stateForMethod('DELETE') !== 'idle'
                    ? 'Törlés…'
                    : 'Törlés'}
                </button>
              </div>
            )}
          </AddressForm>
        </div>
      ))}
    </div>
  );
}

/**
 * @param {{
 *   addressId: string;
 *   name: string;
 *   label: string;
 *   full?: boolean;
 * } & React.ComponentProps<'input'>}
 */
function AddressField({addressId, name, label, full = false, ...inputProps}) {
  const id = `${addressId}-${name}`;
  return (
    <div className={full ? 'acct-field full' : 'acct-field'}>
      <label className="acct-label" htmlFor={id}>
        {label}
      </label>
      <input className="acct-input" id={id} name={name} {...inputProps} />
    </div>
  );
}

/**
 * @param {{
 *   addressId: AddressFragment['id'];
 *   address: CustomerAddressInput;
 *   defaultAddress: CustomerFragment['defaultAddress'];
 *   children: (props: {
 *     stateForMethod: (method: 'PUT' | 'POST' | 'DELETE') => Fetcher['state'];
 *   }) => React.ReactNode;
 * }}
 */
export function AddressForm({addressId, address, defaultAddress, children}) {
  const {state, formMethod} = useNavigation();
  /** @type {ActionReturnData} */
  const action = useActionData();
  const error = action?.error?.[addressId];
  const isDefaultAddress = defaultAddress?.id === addressId;
  return (
    <Form id={addressId} className="acct-form">
      <input type="hidden" name="addressId" defaultValue={addressId} />
      <AddressField
        addressId={addressId}
        name="firstName"
        label="Keresztnév*"
        aria-label="Keresztnév"
        autoComplete="given-name"
        defaultValue={address?.firstName ?? ''}
        placeholder="Keresztnév"
        required
        type="text"
      />
      <AddressField
        addressId={addressId}
        name="lastName"
        label="Vezetéknév*"
        aria-label="Vezetéknév"
        autoComplete="family-name"
        defaultValue={address?.lastName ?? ''}
        placeholder="Vezetéknév"
        required
        type="text"
      />
      <AddressField
        addressId={addressId}
        name="company"
        label="Cég"
        full
        aria-label="Cég"
        autoComplete="organization"
        defaultValue={address?.company ?? ''}
        placeholder="Cég (nem kötelező)"
        type="text"
      />
      <AddressField
        addressId={addressId}
        name="address1"
        label="Cím*"
        full
        aria-label="Cím"
        autoComplete="address-line1"
        defaultValue={address?.address1 ?? ''}
        placeholder="Utca, házszám"
        required
        type="text"
      />
      <AddressField
        addressId={addressId}
        name="address2"
        label="Cím 2. sor"
        full
        aria-label="Cím 2. sor"
        autoComplete="address-line2"
        defaultValue={address?.address2 ?? ''}
        placeholder="Emelet, ajtó (nem kötelező)"
        type="text"
      />
      <AddressField
        addressId={addressId}
        name="city"
        label="Város*"
        aria-label="Város"
        autoComplete="address-level2"
        defaultValue={address?.city ?? ''}
        placeholder="Város"
        required
        type="text"
      />
      <AddressField
        addressId={addressId}
        name="zoneCode"
        label="Megye / tartomány*"
        aria-label="Megye / tartomány"
        autoComplete="address-level1"
        defaultValue={address?.zoneCode ?? ''}
        placeholder="pl. Budapest"
        required
        type="text"
      />
      <AddressField
        addressId={addressId}
        name="zip"
        label="Irányítószám*"
        aria-label="Irányítószám"
        autoComplete="postal-code"
        defaultValue={address?.zip ?? ''}
        placeholder="Irányítószám"
        required
        type="text"
      />
      <AddressField
        addressId={addressId}
        name="territoryCode"
        label="Országkód*"
        aria-label="Országkód"
        autoComplete="country"
        defaultValue={address?.territoryCode ?? ''}
        placeholder="HU"
        required
        type="text"
        maxLength={2}
      />
      <AddressField
        addressId={addressId}
        name="phoneNumber"
        label="Telefon"
        full
        aria-label="Telefonszám"
        autoComplete="tel"
        defaultValue={address?.phoneNumber ?? ''}
        placeholder="+36301234567"
        pattern="^\+?[1-9]\d{3,14}$"
        type="tel"
      />
      <div className="acct-check full">
        <input
          defaultChecked={isDefaultAddress}
          id={`${addressId}-defaultAddress`}
          name="defaultAddress"
          type="checkbox"
        />
        <label htmlFor={`${addressId}-defaultAddress`}>
          Legyen ez az alapértelmezett cím
        </label>
      </div>
      {error && (
        <p className="acct-error" role="alert">
          {error}
        </p>
      )}
      {children({
        stateForMethod: (method) => (formMethod === method ? state : 'idle'),
      })}
    </Form>
  );
}

/**
 * @typedef {{
 *   addressId?: string | null;
 *   createdAddress?: AddressFragment;
 *   defaultAddress?: string | null;
 *   deletedAddress?: string | null;
 *   error: Record<AddressFragment['id'], string> | null;
 *   updatedAddress?: AddressFragment;
 * }} ActionResponse
 */

/** @typedef {import('@shopify/hydrogen/customer-account-api-types').CustomerAddressInput} CustomerAddressInput */
/** @typedef {import('customer-accountapi.generated').AddressFragment} AddressFragment */
/** @typedef {import('customer-accountapi.generated').CustomerFragment} CustomerFragment */
/** @template T @typedef {import('react-router').Fetcher<T>} Fetcher */
/** @typedef {import('./+types/account.addresses').Route} Route */
/** @typedef {ReturnType<typeof useLoaderData<typeof loader>>} LoaderReturnData */
/** @typedef {ReturnType<typeof useActionData<typeof action>>} ActionReturnData */
