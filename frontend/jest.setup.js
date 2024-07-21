import React from 'react';
import '@testing-library/jest-dom';

global.React = React;

jest.mock('react-dom/test-utils', () => ({
  ...jest.requireActual('react-dom/test-utils'),
  act: React.act,
}));