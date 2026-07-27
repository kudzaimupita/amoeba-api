/* eslint-disable prettier/prettier */
/* eslint-disable no-plusplus */
/* eslint-disable prettier/prettier */
// @ts-nocheck
// @ts-ignore
function getNextSemVer(currentVersion, releaseType = 'patch') {
  const [major, minor, patch, preRelease] = currentVersion.split('.');

  let newMajor = parseInt(major, 10);
  let newMinor = parseInt(minor, 10);
  let newPatch = parseInt(patch, 10);
  let newPreRelease = preRelease ? preRelease.split('-')[1] : null;

  switch (releaseType) {
    case 'major':
      newMajor++;
      newMinor = 0;
      newPatch = 0;
      newPreRelease = null;
      break;
    case 'minor':
      newMinor++;
      newPatch = 0;
      newPreRelease = null;
      break;
    case 'patch':
      newPatch++;
      newPreRelease = null;
      break;
    default:
      throw new Error('Invalid release type. Must be "major", "minor", or "patch".');
  }

  return `${newMajor}.${newMinor}.${newPatch}${newPreRelease ? `-${newPreRelease}` : ''}`;
}

export default getNextSemVer