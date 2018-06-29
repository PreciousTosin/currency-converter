/* eslint-disable import/no-extraneous-dependencies */
import 'bootstrap';
import alertify from 'alertifyjs';
import idb from 'idb';
import 'alertifyjs/build/css/alertify.min.css';
import 'alertifyjs/build/css/themes/default.min.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import '../public/stylesheets/styles.css';

const $ = require('jquery');
require('isomorphic-fetch');

function updateReady(worker) {
  // add code for dialog here if response is positive
  // run the subsequent code
  // worker.postMessage({ action: 'skipWaiting' });
  worker.addEventListener('statechange', () => {
    if (worker.state === 'activating') {
      console.log('WAITING SERVICE WORKER ACTIVATING');
    }
  });

  worker.addEventListener('statechange', () => {
    if (worker.state === 'activated') {
      console.log('WAITING SERVICE WORKER ACTIVATED');
    }
  });

  alertify.confirm('Refresh Browser for Fresh Content?',
    () => {
      worker.postMessage({ action: 'skipWaiting' });
      alertify.success('Page Refreshed');
    }, () => {
      alertify.error('Dismissed');
    })
    .set('labels', { ok: 'Refresh!', cancel: 'Dismiss!' })
    .setHeader('<em> Refresh Browser </em> ');
  // loose
}

function trackInstalling(worker) {
  worker.addEventListener('statechange', () => {
    if (worker.state === 'installed') {
      // tell user with  dialog box
      updateReady(worker);
      console.log('Worker Installed');
    }

    if (worker.state === 'activated') {
      // updateReady(worker);
      console.log('Worker Activated');
    }
  });

  worker.addEventListener('onerror', () => {
    console.log('ERROR IN INSTALLATION');
  });
}

// eslint-disable-next-line no-unused-vars
function registerServiceWorker() {
  navigator.serviceWorker.register('sw.js')
    .then((reg) => {
      console.log(reg.installing);
      console.log(reg.waiting);

      if (reg.installing) {
        console.log('Worker Installing');
        trackInstalling(reg.installing);
      }

      if (reg.waiting) {
        console.log('Worker Waiting');
        updateReady(reg.waiting);
      }

      reg.addEventListener('updatefound', () => {
        console.log('FOUND WORKER UPDATE');
        trackInstalling(reg.installing);
      });

      let refreshing = false;
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        console.log('CONTROLLER HAS CHANGED');
        if (refreshing) return;
        window.location.reload();
        refreshing = true;
      });
    });
}

function createDatabase() {
  if (!navigator.serviceWorker) {
    return Promise.resolve();
  }
  return idb.open('currencyapi', 1, (upgradeDb) => {
    upgradeDb.createObjectStore('currencyStore', {
      keyPath: 'currencyId',
    });
  });
}

function idbMethods(dbPromise) {
  return {
    get(key, storeName) {
      return dbPromise().then(db => db.transaction(storeName)
        .objectStore(storeName).get(key));
    },
    set(data, storeName) {
      console.log('STORING DATA IN DATABASE!!!!');
      return dbPromise().then((db) => {
        const tx = db.transaction(storeName, 'readwrite');
        data.forEach(dataItem => tx.objectStore(storeName).put(dataItem));
        return tx.complete;
      });
    },
    delete(key, storeName) {
      return dbPromise().then((db) => {
        const tx = db.transaction(storeName, 'readwrite');
        tx.objectStore(storeName).delete(key);
        return tx.complete;
      });
    },
    clear(storeName) {
      console.log('CLEARING DATABASE!!!!');
      return dbPromise().then((db) => {
        const tx = db.transaction(storeName, 'readwrite');
        tx.objectStore(storeName).clear();
        return tx.complete;
      });
    },
    keys(storeName) {
      return dbPromise().then((db) => {
        const tx = db.transaction(storeName);
        const keys = [];
        const store = tx.objectStore(storeName);

        // This would be store.getAllKeys(), but it isn't supported by Edge or Safari.
        // openKeyCursor isn't supported by Safari, so we fall back
        (store.iterateKeyCursor || store.iterateCursor).call(store, (cursor) => {
          if (!cursor) return;
          keys.push(cursor.key);
          cursor.continue();
        });

        return tx.complete.then(() => keys);
      });
    },
    retrieveAll(storeName) {
      return dbPromise().then(db => db.transaction(storeName)
        .objectStore(storeName).getAll()).then(allObjs => allObjs);
    },
  };
}

function fillSelect(data) {
  data.forEach((currency) => {
    const firstSel = document.getElementById('first-currency');
    const secondSel = document.getElementById('second-currency');
    const firstOption = document.createElement('option');
    const secondOption = document.createElement('option');

    firstOption.value = currency.currencyId;
    firstOption.text = currency.currencyName;
    secondOption.value = currency.currencyId;
    secondOption.text = currency.currencyName;

    firstSel.add(firstOption, null);
    secondSel.add(secondOption, null);
  });
}

function storeSelectData(data) {
  return new Promise((resolve, reject) => {
    idbMethods(createDatabase).set(data, 'currencyStore')
      .then((isComplete) => {
        console.log('ADDED DATA TO IDB');
        resolve(isComplete);
      })
      .catch(error => reject(error));
  });
}

/*
* @dev function to fetch currency data (id, name and symbol from api)
*/
function fetchCurrency() {
  return new Promise((resolve, reject) => {
    fetch('https://free.currencyconverterapi.com/api/v5/currencies')
      .then(response => response.json())
      .then((data) => {
        console.log(data);
        const results = Object.entries(data.results);
        const resultArr = [];
        results.forEach((result) => {
          resultArr.push({
            currencyId: result[0],
            currencyName: result[1].currencyName,
            currencySymbol: result[1].currencySymbol,
          });
        });
        return resultArr;
      })
      .then(newData => resolve(newData))
      .catch(error => reject(error));
  });
}

function convert(inputValue, exchRate) {
  return inputValue * exchRate;
}

/*
* @dev function to convert one currency to the other
*/
function convertCurrency() {
  const firstCurrencyElem = document.querySelector('#first-currency');
  const secondCurrencyElem = document.querySelector('#second-currency');
  const firstVal = firstCurrencyElem.options[firstCurrencyElem.selectedIndex].value;
  const secondVal = secondCurrencyElem.options[secondCurrencyElem.selectedIndex].value;
  const inputVal = document.querySelector('#input--value').value;
  console.log({ firstVal, secondVal, inputVal });
  fetch(`https://free.currencyconverterapi.com/api/v5/convert?q=${firstVal}_${secondVal}&compact=ultra`)
    .then(response => response.json())
    .then((data) => {
      const rateData = Object.entries(data);
      console.log(rateData);
      const convertedVal = convert(inputVal, rateData[0][1]);
      const rateValue = rateData[0][1];
      console.log({ inputVal, rateValue, convertedVal });
      console.log(convertedVal.toString());
      document.querySelector('.results--container').innerHTML = convertedVal.toString();
    })
    .catch(error => console.log(error));
}

/*
* @dev function to add various event handlers
*/
function addEvents() {
  document.querySelector('#submit-btn').addEventListener('click', (event) => {
    event.preventDefault();
    convertCurrency();
  });
}

$(document).ready(() => {
  idbMethods(createDatabase).retrieveAll('currencyStore')
    .then((obj) => {
      if ($.isEmptyObject(obj)) { // if currencyStore doesn't contains currency symbols, names
        fetchCurrency().then((result) => { // send fetch request to api
          fillSelect(result);
          storeSelectData(result); // store api data in idb
        }).catch(error => console.log(error));
      } else { // if store contains content, fill from idb instead
        fillSelect(obj);
      }
    });
  addEvents();
  // eslint-disable-next-line no-unused-vars
});
