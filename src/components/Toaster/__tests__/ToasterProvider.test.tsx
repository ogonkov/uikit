import {act, render, screen} from '@testing-library/react';
import React, {useEffect} from 'react';
import {useToaster} from '../hooks/useToaster';
import {ToasterComponent} from '../ToasterComponent/ToasterComponent';
import {ToasterProvider} from '../Provider/ToasterProvider';
import {ToasterPublicMethods} from '../types';
import {getToast} from './getToast';
import {tick} from './tick';
import {fireAnimationEndEvent} from './fireAnimationEndEvent';

function ToastAPI({onMount}: {onMount: (api: ToasterPublicMethods) => void}) {
    const toaster = useToaster();

    useEffect(() => {
        onMount(toaster);
    }, []);

    return null;
}

function setup() {
    let providerAPI: undefined | ToasterPublicMethods;

    render(
        <ToasterProvider>
            <ToastAPI
                onMount={(api) => {
                    providerAPI = api;
                }}
            />
            <ToasterComponent />
        </ToasterProvider>,
    );

    if (!providerAPI) {
        throw new Error('Failed to setup test');
    }

    return providerAPI;
}

const toastTimeout = 1000;
const toastProps = {
    name: 'test',
    title: 'Test Toast',
};

beforeEach(() => jest.useFakeTimers());
afterEach(() => jest.useRealTimers());

// We test that after adding toast the next add will remove
// previous toast from DOM and add it again
it('should override already added toast', async function () {
    const providerAPI = setup();

    act(() => {
        providerAPI.add(toastProps);
    });

    let toast = getToast();

    expect(toast).toBeInTheDocument();

    jest.advanceTimersByTime(1);

    act(() => {
        providerAPI.add(toastProps);
    });

    expect(toast).not.toBeInTheDocument();

    toast = await screen.findByText('Test Toast');

    expect(toast).toBeInTheDocument();
});

it('should remove toast after timeout', function () {
    const providerAPI = setup();

    act(() => {
        providerAPI.add({
            ...toastProps,
            timeout: toastTimeout,
        });
    });

    const toast = getToast();
    expect(toast).toBeInTheDocument();

    tick(toast, toastTimeout / 2);

    expect(toast).toBeInTheDocument();

    act(() => {
        jest.advanceTimersByTime(toastTimeout / 2);
    });

    expect(toast).toBeInTheDocument();

    fireAnimationEndEvent(toast, 'toast-hide-end');

    expect(toast).not.toBeInTheDocument();
});
