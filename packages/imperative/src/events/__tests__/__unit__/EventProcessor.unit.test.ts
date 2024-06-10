import { EventProcessor } from '../../src/EventProcessor';
import { Logger } from '../../../logger/src/Logger';
import { IProcessorTypes } from '../../src/doc/IEventInstanceTypes';
import { EventOperator } from '../..';

jest.mock('../../../logger/src/Logger');
jest.mock('../../src/EventUtils');
jest.mock('../../../error/src/ImperativeError');

describe('EventProcessor Unit Tests', () => {
    const appName = 'TestApp';
    const logger = Logger.getImperativeLogger();

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('constructor initializes EventProcessor correctly', () => {
        expect(EventOperator['instances'].get(appName)).toBeUndefined();

        EventOperator.getProcessor(appName);

        expect(EventOperator['instances'].get(appName)).toBeDefined();
    });
});
