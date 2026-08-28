function requireMethod(dependency, dependencyName, methodName) {
  if (!dependency || typeof dependency[methodName] !== 'function') {
    throw new TypeError(`${dependencyName}.${methodName} must be a function`);
  }
}

function requireFunction(value, name) {
  if (typeof value !== 'function') {
    throw new TypeError(`${name} must be a function`);
  }
}

function assertServiceDependencies({ repository, mailer, clock, idFactory, repositoryMethod, mailerMethod }) {
  requireMethod(repository, 'repository', repositoryMethod);
  requireMethod(mailer, 'mailer', mailerMethod);
  requireFunction(clock, 'clock');
  requireFunction(idFactory, 'idFactory');
}

function requireSuccessfulWrite(result, methodName) {
  if (!result || result.ok !== true) {
    const error = new Error(`${methodName} failed`);
    error.code = 'PERSISTENCE_FAILED';
    throw error;
  }
  return result.value;
}

module.exports = {
  assertServiceDependencies,
  requireSuccessfulWrite
};
