import {LoginPasswordAuthMethod, ClientSdk} from "../src";
import {getUserByTitle} from "./utils/userUtils";
import {API_URL, User, WS_URL} from "./vars";
import {afterAll, beforeAll, describe, expect, it} from "vitest";
import {PositionsHelper} from "./utils/positionsHelper";

describe('Positions', () => {
    let sdk: ClientSdk;
    let positionsHelper: PositionsHelper;

    beforeAll(async () => {
        const user = getUserByTitle('positions_user') as User;
        sdk = await ClientSdk.create(WS_URL, 82, new LoginPasswordAuthMethod(API_URL, user.email, user.password));
        positionsHelper = await PositionsHelper.create(sdk);
    });

    afterAll(async function () {
        await sdk.shutdown();
    });

    describe('History positions', () => {
        const pages = [{page: 1, count: 30}, {page: 2, count: 90}]

        pages.forEach(({page, count}) => {

            it(`${page} more pages should be loaded, positions count ${count}`, async () => {
                const historyPositions = await positionsHelper.loadHistoryPositions(page);
                expect(historyPositions.length, 'History positions count must be ' + count).eq(count);
            });
        })

    });
});