import { Logging, Workspace } from '@aws/language-server-runtimes/server-interface'
import { expect } from 'chai'
import * as fs from 'fs'
import { StubbedInstance, stubInterface } from 'ts-sinon'
import { ArtifactManager } from '../artifactManager'
import { RequirementJson, StartTransformRequest } from '../models'
import { EXAMPLE_REQUEST } from './mockData'
import assert = require('assert')
import path = require('path')
import os = require('os')

describe('Test ArtifactManager ', () => {
    const mockedLogging = stubInterface<Logging>()
    const workspacePath = path.join(os.tmpdir(), 'test')

    let workspace: StubbedInstance<Workspace>
    let artifactManager: ArtifactManager
    beforeEach(async () => {
        workspace = stubInterface<Workspace>()
        artifactManager = new ArtifactManager(workspace, mockedLogging, workspacePath)
    })

    afterEach(async () => {
        artifactManager.cleanup()
    })

    describe('test create requirement json', () => {
        it.skip('should return correct requirment json content', async () => {
            const requestString = JSON.stringify(EXAMPLE_REQUEST)
            const request = JSON.parse(requestString) as StartTransformRequest
            await artifactManager.createRequirementJson(request)
            const jsonPath = path.join(workspacePath, 'artifact', 'requirement.json')
            expect(fs.existsSync(jsonPath)).to.be.true
            const requirementJson: RequirementJson = JSON.parse(fs.readFileSync(jsonPath, { encoding: 'utf8' }))
            expect(requirementJson.EntryPath).to.equal('sourceCode\\CoreMVC\\CoreMVC.csproj')
            expect(requirementJson.Projects.length).to.equal(2)
            const reference = requirementJson.Projects.filter(function (item) {
                return item.projectFilePath === 'sourceCode\\test\\test.csproj'
            })
            expect(reference.length).to.equal(1)
            expect(reference[0].references.length).to.equal(2)
            const r = reference[0].references.filter(function (item) {
                return (
                    item.relativePath ===
                    'references\\Reference Assemblies\\Microsoft\\Framework\\.NETFramework\\v4.0\\System.Drawing.dll'
                )
            })
            expect(r.length).to.equal(1)
            expect(r[0].includedInArtifact).to.be.false
        })

        it('should handle empty request', async () => {
            // Test case to verify that the function gracefully handles an empty request
            const request: StartTransformRequest = {
                SolutionRootPath: '',
                TargetFramework: 'net8.0',
                ProgramLanguage: 'csharp',
                SelectedProjectPath: '',
                SolutionConfigPaths: [],
                ProjectMetadata: [],

                command: 'aws/qNetTransform/startTransform',
            }
            await artifactManager.createRequirementJson(request)

            const jsonPath = path.join(workspacePath, 'artifact', 'requirement.json')
            expect(fs.existsSync(jsonPath)).to.be.true

            const requirementJson: RequirementJson = JSON.parse(fs.readFileSync(jsonPath, { encoding: 'utf8' }))
            expect(requirementJson.EntryPath).to.equal('')
            expect(requirementJson.Projects.length).to.equal(0)
        })
    })
})
