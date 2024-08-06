import path from 'path'
import fs from 'fs'
import Settings from '../../../lib/settings'
import { buildTriggerEvent, initializeNock, loadInstance, repository, teardownNock } from '../common'

const loadConfig = configFilename => {
  const pathToConfig = new URL(path.join('../../fixtures/repository', configFilename), import.meta.url)
  const configFile = Buffer.from(fs.readFileSync(pathToConfig, 'utf8'))

  return configFile.toString()
}

describe('repository plugin', function () {
  let probot, githubScope

  beforeEach(() => {
    githubScope = initializeNock()
    probot = loadInstance()
  })

  afterEach(() => {
    teardownNock(githubScope)
  })

  it('syncs repo with basic settings', async () => {
    const config = loadConfig('basic-config.yml')
    const repoSettings = Object.assign({}, config.repository)

    githubScope
      .get(`/repos/${repository.owner.name}/${repository.name}/contents/${encodeURIComponent(Settings.FILE_NAME)}`)
      .reply(200, config)
    githubScope
      .patch(`/repos/${repository.owner.name}/${repository.name}`, body => {
        expect(body).toMatchObject(repoSettings)
        return true
      })
      .matchHeader('accept', ['application/vnd.github.baptiste-preview+json'])
      .reply(200)

    await probot.receive(buildTriggerEvent())
  })

  it('replaces topics, when provided', async () => {
    const config = loadConfig('basic-config-with-topics.yml')
    const repoSettings = Object.assign({}, config.repository)

    githubScope
      .get(`/repos/${repository.owner.name}/${repository.name}/contents/${encodeURIComponent(Settings.FILE_NAME)}`)
      .reply(200, config)
    githubScope
      .patch(`/repos/${repository.owner.name}/${repository.name}`, body => {
        expect(body).toMatchObject(repoSettings)
        return true
      })
      .matchHeader('accept', ['application/vnd.github.baptiste-preview+json'])
      .reply(200)
    githubScope
      .put(`/repos/${repository.owner.name}/${repository.name}/topics`, body => {
        expect(body).toMatchObject({ names: ['github', 'probot'] })
        return true
      })
      .matchHeader('accept', ['application/vnd.github.mercy-preview+json'])
      .reply(200)

    await probot.receive(buildTriggerEvent())
  })

  it('syncs repo with basic settings and vulnerability alerts enabled', async () => {
    const config = loadConfig('basic-config-with-vulnerability-alerts.yml')
    const repoSettings = Object.assign({}, config.repository)
    delete repoSettings.enable_vulnerability_alerts

    githubScope
      .get(`/repos/${repository.owner.name}/${repository.name}/contents/${encodeURIComponent(Settings.FILE_NAME)}`)
      .reply(200, config)
    githubScope
      .patch(`/repos/${repository.owner.name}/${repository.name}`, body => {
        expect(body).toMatchObject(repoSettings)
        return true
      })
      .matchHeader('accept', ['application/vnd.github.baptiste-preview+json'])
      .reply(200)
    githubScope
      .put(`/repos/${repository.owner.name}/${repository.name}/vulnerability-alerts`, body => true)
      .matchHeader('accept', ['application/vnd.github.dorian-preview+json'])
      .reply(200)

    await probot.receive(buildTriggerEvent())
  })

  it('syncs repo with basic settings and security fixes enabled', async () => {
    const config = loadConfig('basic-config-with-security-fixes.yml')
    const repoSettings = Object.assign({}, config.repository)
    delete repoSettings.enable_automated_security_fixes

    githubScope
      .get(`/repos/${repository.owner.name}/${repository.name}/contents/${encodeURIComponent(Settings.FILE_NAME)}`)
      .reply(200, config)
    githubScope
      .patch(`/repos/${repository.owner.name}/${repository.name}`, body => {
        expect(body).toMatchObject(repoSettings)
        return true
      })
      .matchHeader('accept', ['application/vnd.github.baptiste-preview+json'])
      .reply(200)
    githubScope
      .put(`/repos/${repository.owner.name}/${repository.name}/automated-security-fixes`, body => true)
      .matchHeader('accept', ['application/vnd.github.london-preview+json'])
      .reply(200)

    await probot.receive(buildTriggerEvent())
  })
})
