import {
    Balance,
    Balances,
    BalanceType,
    LoginPasswordAuthMethod,
    ClientSdk,
    TurboOptionsDirection
} from "../src";
import {API_URL, User, WS_URL} from "./vars";
import {getUserByTitle} from "./utils/userUtils";
import {waitForCondition} from "./utils/waiters";
import {afterAll, beforeAll, describe, expect, it} from "vitest";

describe('Balances', () => {
    let sdk: ClientSdk;
    let balances: Balances;
    const user = getUserByTitle('balance_user') as User;

    beforeAll(async () => {
        sdk = await ClientSdk.create(WS_URL, 82, new LoginPasswordAuthMethod(API_URL, user.email, user.password));
        balances = await sdk.balances();
    })

    afterAll(async () => {
        await sdk.shutdown();
    });

    function getBalance(type: BalanceType) {
        const balance = balances.getBalances().find(value => value.type === type);
        if (!balance) throw new Error(`${type} balance not found`);
        return balance;
    }

    async function openOption(balance: Balance, amount: number) {
        const turboOptions = await sdk.turboOptions();
        const turboOptionsActiveInstruments = await turboOptions.getActives().filter((a) => !a.isSuspended)[0].instruments();
        const availableForBuyAt = turboOptionsActiveInstruments.getAvailableForBuyAt(sdk.currentTime())[0];
        await turboOptions.buy(availableForBuyAt, TurboOptionsDirection.Put, amount, balance)
    }

    it('should reset demo balance', async () => {
        const balance = getBalance(BalanceType.Demo);
        const balanceAmount = balance.amount;
        const defaultBalanceAmount = 10000;
        if (balanceAmount >= defaultBalanceAmount) {
            const amount = balanceAmount - defaultBalanceAmount + 1;
            await openOption(balance, amount);
            expect(await waitForCondition(() => balance.amount === balanceAmount - amount, 2000)).to.be.true;
            expect(balance.amount, "Balance amount should be changed").eq(balanceAmount - amount);
        }
        await balance.resetDemoBalance();
        expect(await waitForCondition(() => balance.amount === defaultBalanceAmount, 2000)).to.be.true;
        expect(balance.amount, "Resent is not working, balance wasn't changed").eq(defaultBalanceAmount);
    });

    it('cannot reset normal balance', async () => {
        const balance = getBalance(BalanceType.Real);
        await expect(balance.resetDemoBalance()).rejects.toThrow("Only demo balance can be reset")
    });
});